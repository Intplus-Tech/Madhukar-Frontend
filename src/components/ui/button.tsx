"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "navy" | "danger" | "success" | "ghost" | "link";
type Size = "sm" | "md" | "lg" | "block";

const VARIANTS: Record<Variant, string> = {
  // The black CTA used across every screen in the Figma
 
  primary: "bg-ink text-ink-inverse hover:bg-black disabled:bg-line-strong disabled:text-ink-inverse",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-muted",
  navy: "bg-admin-accent text-ink-inverse hover:brightness-110",
  danger: "bg-danger-deep text-ink-inverse hover:brightness-110",
  success: "bg-success text-ink-inverse hover:brightness-105",
  ghost: "text-ink hover:bg-surface-muted",
  link: "text-info underline-offset-4 hover:underline",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-meta gap-1.5",
  md: "h-10 px-4 text-body gap-2",
  lg: "h-12 px-6 text-body gap-2",
  block: "h-12 w-full px-6 text-body gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-field font-medium",
        "transition-colors duration-150",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
