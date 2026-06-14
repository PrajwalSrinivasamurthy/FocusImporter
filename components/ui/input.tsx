"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-lg surface px-3 text-sm text-strong",
      "placeholder:text-ink-faint dark:placeholder:text-zinc-500",
      "transition-colors focus-visible:border-scarlet-600/50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
