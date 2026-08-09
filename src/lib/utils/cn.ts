import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge doesn't know about our custom borderRadius keys, so without
 * this it keeps both `rounded-card` and `rounded-none` and lets CSS order
 * decide the winner. Registering them makes overrides behave predictably.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      rounded: [{ rounded: ["card", "field", "pill"] }],
    },
  },
});

/** Merge conditional class names, letting later Tailwind classes win. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}