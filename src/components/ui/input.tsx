"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <label className={cn("mb-1.5 block text-eyebrow font-semibold uppercase tracking-wide text-ink-muted", className)}>
      {children}
    </label>
  );
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  /** Named `leading`/`trailing` rather than prefix/suffix — those collide with HTML attrs. */
  leading?: ReactNode;
  trailing?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leading, trailing, invalid, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "flex h-12 w-full items-center gap-2 rounded-field border bg-surface-muted px-3.5",
        "focus-within:ring-2 focus-within:ring-ink focus-within:ring-offset-1 focus-within:ring-offset-app",
        invalid ? "border-danger" : "border-line",
        className,
      )}
    >
      {leading && <span className="shrink-0 text-ink-faint">{leading}</span>}
      <input
        ref={ref}
        className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
        {...props}
      />
      {trailing && <span className="shrink-0 text-ink-faint">{trailing}</span>}
    </div>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded-field border border-line bg-surface-muted px-3.5 py-3 text-body text-ink",
          "outline-none placeholder:text-ink-faint",
          "focus:ring-2 focus:ring-ink focus:ring-offset-1 focus:ring-offset-app",
          className,
        )}
        {...props}
      />
    );
  },
);

/** Currency field with a leading ₹, as drawn in the planning cards. */
export const CurrencyInput = forwardRef<HTMLInputElement, InputProps>(function CurrencyInput(
  { className, ...props },
  ref,
) {
  return (
    <Input
      ref={ref}
      inputMode="decimal"
      type="number"
      min={0}
      leading={<span className="text-body text-ink-muted">₹</span>}
      className={cn("h-12", className)}
      {...props}
    />
  );
});
