import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/new-madhukar.png"
      alt="new-madhukar"
      width={112}
      height={112}
      priority
      className={cn("h-28 w-28", className)}
    />
  );
}