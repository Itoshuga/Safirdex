"use client";

import { Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function MaintenanceTiming({
  estimatedEndAtIso,
  locale,
  countdownLabel,
  estimatedLabel,
}: {
  estimatedEndAtIso: string;
  locale: string;
  countdownLabel: string;
  estimatedLabel: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  const target = useMemo(
    () => new Date(estimatedEndAtIso).getTime(),
    [estimatedEndAtIso],
  );
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Europe/Paris",
      }).format(new Date(target)),
    [locale, target],
  );

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNow(Date.now()));
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const remaining = Math.max(0, target - (now ?? target));
  const totalSeconds = Math.floor(remaining / 1_000);
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  const countdown = [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");

  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left backdrop-blur-sm">
        <p className="flex items-center gap-2 text-[0.65rem] font-semibold tracking-[0.12em] text-white/55 uppercase">
          <Clock3 className="size-3.5" aria-hidden="true" />
          {estimatedLabel}
        </p>
        <time
          dateTime={estimatedEndAtIso}
          className="mt-2 block text-sm font-medium text-white/90"
        >
          {formattedDate}
        </time>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left backdrop-blur-sm">
        <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-white/55 uppercase">
          {countdownLabel}
        </p>
        <p
          className="mt-1.5 font-heading text-2xl font-semibold tracking-[0.08em] text-white tabular-nums"
          role="timer"
          aria-live="off"
        >
          {now === null ? "––:––:––" : countdown}
        </p>
      </div>
    </div>
  );
}
