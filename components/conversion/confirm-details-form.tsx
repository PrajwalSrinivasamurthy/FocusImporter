"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ConversionDetails } from "@/lib/types";

// ── Partner type ─────────────────────────────────────────────────────────────

type PartnerType = "district" | "international";

// ── Static config ────────────────────────────────────────────────────────────

const DISTRICT = {
  regions: [{ value: "20", label: "20" }],
  profiles: [{ value: "[S26] District Partnership FT", label: "[S26] District Partnership FT" }],
  defaultEnrollment: "DP",
} as const;

const INTERNATIONAL = {
  regions: [
    { value: "14", label: "14" },
    { value: "22", label: "22" },
    { value: "23", label: "23" },
  ],
  profileByRegion: {
    "14": "[S14] Full-time INTL Partner (FTINTL_P_TTU)",
    "22": "[S22] INTL Middle School",
    "23": "[S23] INTL Learning Academy",
  } as Record<string, string>,
  defaultEnrollment: "INLT",
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayMDY(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function defaultsForType(type: PartnerType, syear = "2026", startDate = todayMDY(), schoolId = "001"): ConversionDetails {
  if (type === "district") {
    return {
      regionCode: "20",
      profile: DISTRICT.profiles[0].value,
      syear,
      enrollmentCode: DISTRICT.defaultEnrollment,
      startDate,
      schoolId,
    };
  }
  return {
    regionCode: "14",
    profile: INTERNATIONAL.profileByRegion["14"],
    syear,
    enrollmentCode: INTERNATIONAL.defaultEnrollment,
    startDate,
    schoolId,
  };
}

function detectType(v: ConversionDetails): PartnerType {
  return v.enrollmentCode === "DP" || v.regionCode === "20" ? "district" : "international";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline gap-2 font-display text-xs font-medium text-strong">
      {children}
      {hint && <span className="text-[10px] font-normal text-muted">{hint}</span>}
    </label>
  );
}

const baseInput =
  "h-9 w-full rounded-lg border border-paper-line bg-paper px-3 font-mono text-sm text-strong placeholder:text-ink-faint focus:border-scarlet-600 focus:outline-none focus:ring-2 focus:ring-scarlet-600/20 dark:border-night-line dark:bg-night dark:text-strong dark:focus:border-scarlet-400 dark:focus:ring-scarlet-400/20 disabled:opacity-50";

function Select({
  id,
  value,
  onChange,
  disabled,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`${baseInput} appearance-none cursor-pointer pr-8`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ConfirmDetailsFormProps {
  onConfirm: (details: ConversionDetails) => void;
  initialValues?: ConversionDetails;
  disabled?: boolean;
}

export function ConfirmDetailsForm({ onConfirm, initialValues, disabled }: ConfirmDetailsFormProps) {
  const [type, setType] = useState<PartnerType>(
    initialValues ? detectType(initialValues) : "district"
  );
  const [values, setValues] = useState<ConversionDetails>(
    initialValues ?? defaultsForType("district")
  );

  const switchType = (t: PartnerType) => {
    setType(t);
    // Carry syear, startDate, and schoolId across; reset region/profile/enrollment
    setValues(defaultsForType(t, values.syear, values.startDate, values.schoolId));
  };

  const handleRegionChange = (region: string) => {
    setValues((prev) => ({
      ...prev,
      regionCode: region,
      ...(type === "international"
        ? { profile: INTERNATIONAL.profileByRegion[region] ?? prev.profile }
        : {}),
    }));
  };

  const set = (key: keyof ConversionDetails, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const regionOptions = type === "district" ? [...DISTRICT.regions] : [...INTERNATIONAL.regions];
  const profileOptions =
    type === "district"
      ? [...DISTRICT.profiles]
      : INTERNATIONAL.regions.map(({ value: rv }) => ({
          value: INTERNATIONAL.profileByRegion[rv],
          label: INTERNATIONAL.profileByRegion[rv],
        }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(values);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-paper-line bg-paper-raised/60 px-6 py-5 dark:border-night-line dark:bg-night-raised/60"
      >
        {/* Header row: label + toggle */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-scarlet-600 dark:text-scarlet-400">
            Confirm Details
          </p>
          <div className="flex items-center rounded-lg border border-paper-line bg-paper p-0.5 dark:border-night-line dark:bg-night">
            {(["district", "international"] as PartnerType[]).map((t) => (
              <button
                key={t}
                type="button"
                disabled={disabled}
                onClick={() => switchType(t)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold capitalize transition-all ${
                  type === t
                    ? "bg-scarlet-600 text-white shadow-sm"
                    : "text-muted hover:text-strong disabled:opacity-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Region Code */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="detail-regionCode">Region Code</FieldLabel>
            <Select
              id="detail-regionCode"
              value={values.regionCode}
              onChange={handleRegionChange}
              disabled={disabled}
              options={regionOptions}
            />
          </div>

          {/* Profile */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="detail-profile">Profile</FieldLabel>
            <Select
              id="detail-profile"
              value={values.profile}
              onChange={(v) => set("profile", v)}
              disabled={disabled}
              options={profileOptions}
            />
          </div>

          {/* Syear */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="detail-syear">Syear</FieldLabel>
            <input
              id="detail-syear"
              type="text"
              value={values.syear}
              onChange={(e) => set("syear", e.target.value)}
              disabled={disabled}
              className={baseInput}
            />
          </div>

          {/* Enrollment Code */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="detail-enrollmentCode">Enrollment Code</FieldLabel>
            <input
              id="detail-enrollmentCode"
              type="text"
              value={values.enrollmentCode}
              onChange={(e) => set("enrollmentCode", e.target.value)}
              disabled={disabled}
              className={baseInput}
            />
          </div>

          {/* School ID — kept as text so leading zeros (001) are preserved */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="detail-schoolId">School ID</FieldLabel>
            <input
              id="detail-schoolId"
              type="text"
              value={values.schoolId}
              onChange={(e) => set("schoolId", e.target.value)}
              disabled={disabled}
              className={baseInput}
            />
          </div>

          {/* Start Date */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="detail-startDate" hint="MM/DD/YYYY">
              Start Date
            </FieldLabel>
            <input
              id="detail-startDate"
              type="text"
              value={values.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              placeholder="MM/DD/YYYY"
              disabled={disabled}
              className={baseInput}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="submit" size="lg" disabled={disabled}>
            Confirm &amp; Convert
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
