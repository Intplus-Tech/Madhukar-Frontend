"use client";

import { useCallback, useState } from "react";

/**
 * Owns the billing review session.
 *
 * The panel has three states rather than two:
 *   closed    — nothing in review
 *   open      — panel visible
 *   docked    — minimised to a tab on the right edge, work preserved
 *
 * `advance` moves to the next order in the queue after a confirm or a feedback
 * send, so accounts can work straight through the pending list without
 * reopening the panel each time. It returns false when the queue runs out,
 * which tells the caller to close instead.
 */
export function useBillingQueue(queue: string[], labelFor?: (id: string) => string) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [docked, setDocked] = useState(false);

  const openAt = useCallback((orderId: string) => {
    setActiveId(orderId);
    setDocked(false);
  }, []);

  const close = useCallback(() => {
    setActiveId(null);
    setDocked(false);
  }, []);

  const minimise = useCallback(() => setDocked(true), []);
  const restore = useCallback(() => setDocked(false), []);

  const advance = useCallback(() => {
    if (!activeId) return false;
    const index = queue.indexOf(activeId);

    // The processed order has usually left the pending queue by now, so the
    // "next" one has already shifted into this index.
    const next = queue[index + 1] ?? queue.find((id) => id !== activeId);
    if (!next) return false;

    setActiveId(next);
    return true;
  }, [activeId, queue]);

  const activeLabel = activeId ? (labelFor?.(activeId) ?? activeId) : undefined;

  const position = activeId
    ? { index: Math.max(1, queue.indexOf(activeId) + 1), total: queue.length }
    : undefined;

  return {
    activeId,
    activeLabel,
    isOpen: Boolean(activeId) && !docked,
    isDocked: Boolean(activeId) && docked,
    position,
    openAt,
    close,
    minimise,
    restore,
    advance,
  };
}
