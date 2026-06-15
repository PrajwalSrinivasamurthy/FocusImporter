import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccentColor = "scarlet" | "blue" | "violet" | "emerald" | "orange" | "rose";

export interface AccentOption {
  id: AccentColor;
  label: string;
  hex: string; // 600-shade hex for swatch display
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: "scarlet", label: "Scarlet", hex: "#C01F2F" },
  { id: "blue",    label: "Blue",    hex: "#2563EB" },
  { id: "violet",  label: "Violet",  hex: "#7C3AED" },
  { id: "emerald", label: "Emerald", hex: "#059669" },
  { id: "orange",  label: "Orange",  hex: "#EA580C" },
  { id: "rose",    label: "Rose",    hex: "#E11D48" },
];

interface AccentStore {
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
}

export const useAccentStore = create<AccentStore>()(
  persist(
    (set) => ({
      accent: "scarlet",
      setAccent: (accent) => set({ accent }),
    }),
    { name: "fi-accent" }
  )
);
