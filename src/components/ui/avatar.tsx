import { cn } from "@/lib/utils";
import { initialsOf } from "@/lib/utils";

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-meta",
    lg: "h-11 w-11 text-body",
  };
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-pill bg-info-soft font-semibold text-info-ink",
        sizes[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
