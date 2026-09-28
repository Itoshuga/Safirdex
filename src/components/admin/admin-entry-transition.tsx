"use client";

import { useEffect, useState } from "react";

import { SafirLogo } from "@/components/layout/safir-logo";
import { cn } from "@/lib/utils";

const FADE_DELAY_MS = 480;
const TRANSITION_DURATION_MS = 220;
export const ADMIN_TRANSITION_STARTED_AT_KEY = "safirdex:admin-transition-started-at";

type TransitionPhase = "visible" | "leaving" | "ready";

export function AdminLoadingOverlay({
  label,
  leaving = false,
}: {
  label: string;
  leaving?: boolean;
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] grid min-h-dvh place-items-center overflow-hidden bg-background px-6 transition-opacity duration-200",
        leaving && "opacity-0",
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" />
      <div className="relative flex flex-col items-center text-center">
        <div className="relative">
          <span
            className="absolute -inset-3 animate-pulse rounded-2xl bg-safir/12"
            aria-hidden="true"
          />
          <span className="relative grid size-16 place-items-center rounded-2xl border bg-card shadow-xl shadow-safir/10">
            <SafirLogo className="size-10" />
          </span>
        </div>
        <p className="mt-5 font-heading text-xl font-semibold tracking-[-0.03em]">Safirdex</p>
        <p className="mt-1 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </p>
        <span className="mt-5 block h-1 w-36 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <span className="admin-loading-bar block h-full w-1/2 rounded-full bg-safir" />
        </span>
      </div>
    </div>
  );
}

export function AdminEntryTransition({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const [phase, setPhase] = useState<TransitionPhase>("visible");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reducedMotionTimer = window.setTimeout(() => setPhase("ready"), 0);
      return () => window.clearTimeout(reducedMotionTimer);
    }

    const startedAt = Number.parseInt(
      window.sessionStorage.getItem(ADMIN_TRANSITION_STARTED_AT_KEY) ?? "",
      10,
    );
    window.sessionStorage.removeItem(ADMIN_TRANSITION_STARTED_AT_KEY);
    const elapsed = Number.isFinite(startedAt) ? Date.now() - startedAt : 0;
    const validElapsed = elapsed >= 0 && elapsed < 10_000 ? elapsed : 0;
    const fadeDelay = Math.max(0, FADE_DELAY_MS - validElapsed);

    const fadeTimer = window.setTimeout(() => setPhase("leaving"), fadeDelay);
    const readyTimer = window.setTimeout(
      () => setPhase("ready"),
      fadeDelay + TRANSITION_DURATION_MS,
    );

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(readyTimer);
    };
  }, []);

  return (
    <>
      {children}
      {phase !== "ready" ? (
        <AdminLoadingOverlay label={label} leaving={phase === "leaving"} />
      ) : null}
    </>
  );
}
