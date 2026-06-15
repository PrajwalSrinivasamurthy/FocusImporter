"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

export const STAGES = ["Intake", "Confirm Details", "Validate", "Split", "Deliver"] as const;

interface PipelineRailProps {
  /** -1 = not started, 1 = file uploaded, 2..4 = processing, 5 = all complete */
  stage: number;
  className?: string;
}

/**
 * The spine of the app: the file travels left to right along a rail.
 * Completed segments fill scarlet; the segment to Focus SIS appears only
 * when conversion is done, animated with marching ants to nudge the user
 * toward the next step.
 */
export function PipelineRail({ stage, className }: PipelineRailProps) {
  const done = stage >= STAGES.length;

  return (
    <div className={cn("w-full", className)} aria-label="Conversion progress">
      <div className="flex items-center">
        {STAGES.map((label, i) => {
          const isDone = stage > i;
          const isActive = stage === i;
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "relative grid h-9 w-9 place-items-center rounded-full border-2 transition-colors duration-300",
                    isDone &&
                      "border-scarlet-600 bg-scarlet-600 text-white",
                    isActive &&
                      "border-scarlet-600 bg-scarlet-600/10 text-scarlet-700 dark:text-scarlet-400",
                    !isDone &&
                      !isActive &&
                      "border-paper-line bg-paper-raised text-ink-faint dark:border-night-line dark:bg-night-raised dark:text-zinc-500"
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full border-2 border-scarlet-600 animate-pulse-soft"
                    />
                  )}
                  {isDone ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    <span className="font-mono text-xs font-medium">{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "font-display text-[11px] font-medium tracking-wide",
                    isDone || isActive ? "text-strong" : "text-muted"
                  )}
                >
                  {label}
                </span>
              </div>

              {i < STAGES.length - 1 && (
                <div className="relative mx-2 mb-6 h-0.5 flex-1 overflow-hidden rounded-full bg-paper-line dark:bg-night-line">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-scarlet-600"
                    initial={false}
                    animate={{ width: stage > i ? "100%" : "0%" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              )}
            </div>
          );
        })}

      </div>
    </div>
  );
}
