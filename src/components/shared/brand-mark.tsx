import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/new-madhukar.png"
      alt="new-madhukar"
      width={72}
      height={72}
      priority
      className={cn("h-16 w-16", className)}
    />
  );
}