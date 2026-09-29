"use client";

import { useEffect } from "react";

const VIEW_DEDUPLICATION_WINDOW_MS = 6 * 60 * 60 * 1_000;
const recordedThisSession = new Set<string>();

export function CardViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const storageKey = `safirdex:card-view:${slug}`;
    const now = Date.now();
    if (recordedThisSession.has(slug)) return;

    try {
      const lastView = Number(window.localStorage.getItem(storageKey));
      if (Number.isFinite(lastView) && now - lastView < VIEW_DEDUPLICATION_WINDOW_MS) {
        return;
      }
    } catch {
      // Tracking still works when local storage is unavailable.
    }

    recordedThisSession.add(slug);
    void fetch(`/api/cards/${encodeURIComponent(slug)}/view`, {
      method: "POST",
      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) {
          recordedThisSession.delete(slug);
          return;
        }
        try {
          window.localStorage.setItem(storageKey, String(now));
        } catch {
          // The counter was recorded even if the browser cannot persist the marker.
        }
      })
      .catch(() => recordedThisSession.delete(slug));
  }, [slug]);

  return null;
}
