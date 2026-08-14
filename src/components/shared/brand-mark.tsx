import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
  src="/new-madhukar.png"
  alt="Lakshya 72"
  width={320}
  height={320}
  priority
  className={cn("h-16 w-16 object-contain", className)}
/>
  );
}