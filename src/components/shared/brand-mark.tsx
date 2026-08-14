import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The Lakshya 72 logo. width/height set the resolution Next serves; the
 * className controls display size, so they're generous enough that scaling
 * up stays sharp.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/new-madhukar.png"
      alt="Lakshya 72"
      width={512}
      height={512}
      priority
      className={cn("h-40 w-40 object-contain", className)}
    />
  );
}
