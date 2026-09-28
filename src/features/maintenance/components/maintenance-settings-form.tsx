"use client";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Languages,
  LoaderCircle,
  Power,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import { updateMaintenanceConfigAction } from "@/features/maintenance/server/actions";
import type {
  MaintenanceConfig,
  MaintenanceUpdateInput,
} from "@/features/maintenance/types";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/lib/i18n/locales";

function toLocalDateTimeInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatAuditDate(iso: string | null, locale: string) {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(iso));
}

export function MaintenanceSettingsForm({
  initialConfig,
}: {
  initialConfig: MaintenanceConfig;
}) {
  const t = useTranslations("Admin.system.maintenance");
  const locale = useLocale();
  const router = useRouter();
  const [activeLocale, setActiveLocale] = useState<AppLocale>("fr");
  const [enabled, setEnabled] = useState(initialConfig.enabled);
  const [translations, setTranslations] = useState(initialConfig.translations);
  const [estimatedEndAt, setEstimatedEndAt] = useState("");
  const [showEstimatedEnd, setShowEstimatedEnd] = useState(
    initialConfig.showEstimatedEnd,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);
  const [pending, startTransition] = useTransition();

  const estimatedEndAtValue = estimatedEndAt;

  useEffect(() => {
    // Keep the server HTML and the first client render identical. The browser
    // timezone is only applied after hydration.
    const frame = window.requestAnimationFrame(() => {
      setEstimatedEndAt(toLocalDateTimeInput(initialConfig.estimatedEndAtIso));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialConfig.estimatedEndAtIso]);

  useEffect(() => {
    if (!confirmOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setConfirmOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirmOpen]);

  const activatedAt = useMemo(
    () => formatAuditDate(initialConfig.enabledAtIso, locale),
    [initialConfig.enabledAtIso, locale],
  );

  function payload(nextEnabled: boolean): MaintenanceUpdateInput {
    const estimatedEndAtIso = toIso(estimatedEndAtValue);
    return {
      enabled: nextEnabled,
      translations,
      estimatedEndAtIso,
      showEstimatedEnd: Boolean(estimatedEndAtIso) && showEstimatedEnd,
    };
  }

  function save(nextEnabled = enabled) {
    setFeedback(null);
    startTransition(async () => {
      const result = await updateMaintenanceConfigAction(payload(nextEnabled));
      if (result.status === "error" || !result.config) {
        setFeedback("error");
        return;
      }
      setEnabled(result.config.enabled);
      setTranslations(result.config.translations);
      setShowEstimatedEnd(result.config.showEstimatedEnd);
      setEstimatedEndAt(toLocalDateTimeInput(result.config.estimatedEndAtIso));
      setConfirmOpen(false);
      setFeedback("success");
      router.refresh();
    });
  }

  const currentTranslation = translations[activeLocale];

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b bg-[linear-gradient(130deg,color-mix(in_oklch,var(--safir)_9%,var(--card)),var(--card)_60%)] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-safir/12 text-safir">
            <Power className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-safir uppercase">
              {t("eyebrow")}
            </p>
            <h2 className="mt-1 font-heading text-xl font-semibold sm:text-2xl">
              {t("title")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${enabled ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-background text-muted-foreground"}`}
        >
          <span className={`size-2 rounded-full ${enabled ? "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.12)]" : "bg-emerald-500"}`} />
          {enabled ? t("status.active") : t("status.inactive")}
        </span>
      </div>

      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <div className="space-y-7 p-5 sm:p-6">
          <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h3 className="text-sm font-semibold">{t("toggle.label")}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t("toggle.description")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={t("toggle.label")}
              disabled={pending}
              className={`relative h-8 w-14 shrink-0 rounded-full border p-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 ${enabled ? "border-amber-500/35 bg-amber-500" : "bg-muted"}`}
              onClick={() => {
                if (enabled) save(false);
                else setConfirmOpen(true);
              }}
            >
              <span
                className={`block size-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`}
              />
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Languages className="size-4 text-safir" aria-hidden="true" />
              <h3 className="text-sm font-semibold">{t("content.title")}</h3>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t("content.description")}
            </p>
            <div className="mt-4 inline-flex rounded-lg border bg-muted/25 p-1" role="tablist" aria-label={t("content.languageLabel")}>
              {(["fr", "en"] as const).map((language) => (
                <button
                  key={language}
                  type="button"
                  role="tab"
                  aria-selected={activeLocale === language}
                  className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${activeLocale === language ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => setActiveLocale(language)}
                >
                  {language.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-4" role="tabpanel">
              <div className="space-y-1.5">
                <label className="admin-label" htmlFor={`maintenance-title-${activeLocale}`}>
                  {t("content.titleLabel")}
                </label>
                <input
                  id={`maintenance-title-${activeLocale}`}
                  className="admin-input"
                  value={currentTranslation.title}
                  maxLength={120}
                  onChange={(event) =>
                    setTranslations((current) => ({
                      ...current,
                      [activeLocale]: {
                        ...current[activeLocale],
                        title: event.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="admin-label" htmlFor={`maintenance-message-${activeLocale}`}>
                  {t("content.messageLabel")}
                </label>
                <textarea
                  id={`maintenance-message-${activeLocale}`}
                  className="admin-textarea min-h-32"
                  value={currentTranslation.message}
                  maxLength={1_000}
                  onChange={(event) =>
                    setTranslations((current) => ({
                      ...current,
                      [activeLocale]: {
                        ...current[activeLocale],
                        message: event.target.value,
                      },
                    }))
                  }
                />
                <p className="admin-help text-right tabular-nums">
                  {currentTranslation.message.length}/1000
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-safir" aria-hidden="true" />
              <h3 className="text-sm font-semibold">{t("estimate.title")}</h3>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {t("estimate.description")}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="space-y-1.5">
                <label className="admin-label" htmlFor="maintenance-estimated-end">
                  {t("estimate.label")}
                </label>
                <input
                  id="maintenance-estimated-end"
                  type="datetime-local"
                  className="admin-input"
                  value={estimatedEndAtValue}
                  onChange={(event) => {
                    setEstimatedEndAt(event.target.value);
                    if (!event.target.value) setShowEstimatedEnd(false);
                  }}
                />
              </div>
              <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 text-xs font-medium">
                <input
                  type="checkbox"
                  checked={showEstimatedEnd}
                  disabled={!estimatedEndAtValue}
                  className="size-4 accent-safir"
                  onChange={(event) => setShowEstimatedEnd(event.target.checked)}
                />
                {t("estimate.show")}
              </label>
            </div>
            <p className="mt-2 admin-help">{t("estimate.help")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t pt-5">
            <Button type="button" size="lg" disabled={pending} onClick={() => save()}>
              {pending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Save aria-hidden="true" />
              )}
              {pending ? t("actions.saving") : t("actions.save")}
            </Button>
            {feedback === "success" ? (
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-600" role="status">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {t("feedback.saved")}
              </p>
            ) : null}
            {feedback === "error" ? (
              <p className="text-sm font-medium text-destructive" role="alert">
                {t("feedback.error")}
              </p>
            ) : null}
          </div>
        </div>

        <aside className="border-t bg-muted/15 p-5 sm:p-6 xl:border-t-0 xl:border-l">
          <span className={`grid size-10 place-items-center rounded-xl ${enabled ? "bg-amber-500/12 text-amber-600 dark:text-amber-300" : "bg-emerald-500/10 text-emerald-600"}`}>
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-heading text-lg font-semibold">
            {enabled ? t("summary.activeTitle") : t("summary.readyTitle")}
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            {enabled ? t("summary.activeDescription") : t("summary.readyDescription")}
          </p>
          {enabled ? (
            <dl className="mt-5 divide-y rounded-xl border bg-background/70 px-4">
              <div className="py-3">
                <dt className="text-[0.65rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  {t("summary.started")}
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {activatedAt ?? t("summary.justNow")}
                </dd>
              </div>
              <div className="py-3">
                <dt className="text-[0.65rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  {t("summary.activatedBy")}
                </dt>
                <dd className="mt-1 truncate text-sm font-medium">
                  {initialConfig.enabledByLabel ?? initialConfig.updatedByLabel ?? t("summary.unknown")}
                </dd>
              </div>
            </dl>
          ) : (
            <ul className="mt-5 space-y-3 text-xs leading-5 text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />{t("summary.adminAccess")}</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />{t("summary.cache")}</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />{t("summary.login")}</li>
            </ul>
          )}
        </aside>
      </div>

      {confirmOpen ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmOpen(false); }}>
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="maintenance-confirm-title"
            aria-describedby="maintenance-confirm-description"
            className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-xl bg-amber-500/12 text-amber-600 dark:text-amber-300">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </span>
              <Button type="button" variant="ghost" size="icon" aria-label={t("confirmation.close")} onClick={() => setConfirmOpen(false)}>
                <X aria-hidden="true" />
              </Button>
            </div>
            <h3 id="maintenance-confirm-title" className="mt-5 font-heading text-xl font-semibold">
              {t("confirmation.title")}
            </h3>
            <p id="maintenance-confirm-description" className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("confirmation.description")}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" size="lg" disabled={pending} onClick={() => setConfirmOpen(false)}>
                {t("confirmation.cancel")}
              </Button>
              <Button type="button" size="lg" disabled={pending} className="bg-amber-600 text-white hover:bg-amber-700" onClick={() => save(true)}>
                {pending ? <LoaderCircle className="animate-spin" /> : <Power />}
                {pending ? t("actions.saving") : t("confirmation.confirm")}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
