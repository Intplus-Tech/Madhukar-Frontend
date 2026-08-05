import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="Lakshya 72"
      width={72}
      height={72}
      priority
      className={cn("h-16 w-16", className)}
    />
  );
}