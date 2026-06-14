"use client";

import { useEffect } from "react";
import { useAccentStore } from "@/lib/accent-store";

export function AccentApplier() {
  const accent = useAccentStore((s) => s.accent);
  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);
  return null;
}
