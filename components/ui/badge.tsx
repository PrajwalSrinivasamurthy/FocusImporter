import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "neutral" | "scarlet" | "amber" | "green";

const tones: Record<Tone, string> = {
  neutral:
    "bg-black/5 text-ink-soft dark:bg-white/10 dark:text-zinc-300",
  scarlet:
    "bg-scarlet-600/10 text-scarlet-700 dark:text-scarlet-400",
  amber:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  green:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
