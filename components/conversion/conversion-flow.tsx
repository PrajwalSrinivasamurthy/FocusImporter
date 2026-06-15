"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { ConversionDetails, ConversionManifest } from "@/lib/types";
import { api } from "@/lib/api";
import { useJobStore } from "@/lib/job-store";
import { UploadDropzone } from "@/components/conversion/upload-dropzone";
import { ConfirmDetailsForm } from "@/components/conversion/confirm-details-form";
import { PipelineRail, STAGES } from "@/components/conversion/pipeline-rail";
import { IssuesPanel } from "@/components/conversion/issues-panel";
import { DownloadCard } from "@/components/conversion/download-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, RotateCcw } from "lucide-react";

type FlowStatus = "idle" | "confirming" | "converting" | "done";

const COUNTDOWN_SECONDS = 20;

export function ConversionFlow() {
  const [status, setStatus] = useState<FlowStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState(-1);
  const [manifest, setManifest] = useState<ConversionManifest | null>(null);
  const [lastDetails, setLastDetails] = useState<ConversionDetails | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerStarted = useRef(false);

  const addJob = useJobStore((s) => s.addJob);
  const markIssuesOverridden = useJobStore((s) => s.markIssuesOverridden);

  const hasIssues = (manifest?.issues.length ?? 0) > 0;
  const locked = hasIssues && !acknowledged;
  const expired = countdown === 0;

  // Start the 20-second countdown once downloads are unlocked.
  // For clean conversions: starts immediately on "done".
  // For conversions with issues: starts after the user acknowledges.
  useEffect(() => {
    if (status !== "done" || locked || !manifest || timerStarted.current) return;

    timerStarted.current = true;
    setCountdown(COUNTDOWN_SECONDS);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, locked, manifest]);

  // When countdown hits 0, reset the whole flow.
  useEffect(() => {
    if (countdown === 0) {
      toast.error("Session expired — files have been cleared. Please re-upload.");
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const handleFile = (f: File | null) => {
    setFile(f);
    setStage(f ? 1 : -1);
    setStatus(f ? "confirming" : "idle");
  };

  const convert = async (details: ConversionDetails) => {
    if (!file) return;
    setLastDetails(details);
    setStatus("converting");
    setStage(2);
    try {
      const result = await api.convert(file, details, (s) => setStage(s + 2));
      setStage(STAGES.length);
      setManifest(result);
      addJob(result);
      setStatus("done");
      if (result.issues.length === 0) {
        toast.success("Converted cleanly — no issues found.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Conversion failed.");
      setStatus("confirming");
      setStage(1);
    }
  };

  const reset = () => {
    setStatus("idle");
    setFile(null);
    setStage(-1);
    setManifest(null);
    setLastDetails(null);
    setAcknowledged(false);
    setCountdown(null);
    timerStarted.current = false;
  };

  const editDetails = () => {
    setStatus("confirming");
    setManifest(null);
    setStage(1);
    setAcknowledged(false);
    setCountdown(null);
    timerStarted.current = false;
  };

  return (
    <div className="space-y-8">
      <PipelineRail stage={stage} />

      <AnimatePresence mode="wait">
        {status !== "done" && (
          <motion.div
            key="intake"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <UploadDropzone
              file={file}
              onFile={handleFile}
              disabled={status === "converting"}
            />

            {(status === "confirming" || status === "converting") && file && (
              <ConfirmDetailsForm
                onConfirm={convert}
                initialValues={lastDetails ?? undefined}
                disabled={status === "converting"}
              />
            )}

            {status === "converting" && (
              <div className="flex items-center justify-center gap-3 py-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin text-scarlet-600" />
                <span>
                  {stage >= 0 && stage < STAGES.length
                    ? `${STAGES[stage]} in progress…`
                    : "Working…"}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {status === "done" && manifest && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="font-mono text-sm text-strong">
                  {manifest.sourceFileName}
                </p>
                {hasIssues ? (
                  <Badge tone="amber">
                    {manifest.issues.length} issue
                    {manifest.issues.length === 1 ? "" : "s"}
                  </Badge>
                ) : (
                  <Badge tone="green">clean</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={editDetails} title="Edit details and re-convert">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit details
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Convert another
                </Button>
              </div>
            </div>

            {hasIssues && (
              <IssuesPanel
                issues={manifest.issues}
                acknowledged={acknowledged}
                onAcknowledge={() => {
                  setAcknowledged(true);
                  if (manifest) markIssuesOverridden(manifest.jobId);
                }}
              />
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-display text-xs font-semibold uppercase tracking-widest text-muted">
                  Import files {locked && "· acknowledge issues to unlock"}
                </p>
                {countdown !== null && countdown > 0 && (
                  <span className="text-xs tabular-nums text-muted">
                    {countdown}s remaining
                  </span>
                )}
              </div>

              {/* Countdown progress bar — only visible once unlocked */}
              {countdown !== null && countdown > 0 && (
                <div className="h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-scarlet-600"
                    initial={{ width: "100%" }}
                    animate={{ width: `${(countdown / COUNTDOWN_SECONDS) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                {manifest.files.map((f, i) => (
                  <DownloadCard
                    key={f.name}
                    jobId={manifest.jobId}
                    file={f}
                    index={i}
                    locked={locked}
                    expired={expired}
                  />
                ))}
              </div>
              <p className="text-xs text-muted">
                Files are held in memory only — download them before the timer runs out.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
