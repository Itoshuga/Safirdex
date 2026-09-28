import {
  ArrowRight,
  Database,
  Globe2,
  Home,
  Palette,
  Server,
  ShieldCheck,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PreferencesControls } from "@/components/settings/preferences-controls";
import { Link } from "@/i18n/navigation";
import { LOCALE_CONFIG, SUPPORTED_LOCALES } from "@/lib/i18n/locales";

export default async function AdminSettingsPage() {
  const t = await getTranslations("Admin.settings");
  const environment = process.env.NODE_ENV === "production"
    ? t("configuration.production")
    : t("configuration.development");
  const languages = SUPPORTED_LOCALES
    .map((locale) => LOCALE_CONFIG[locale].nativeName)
    .join(" · ");

  return (
    <>
      <AdminPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
        <section className="overflow-hidden rounded-xl border bg-card">
          <div className="flex items-start gap-3 border-b px-5 py-4 sm:px-6">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-safir/10 text-safir">
              <Palette className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-heading text-xl font-semibold">{t("appearance.title")}</h2>
              <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
                {t("appearance.description")}
              </p>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <PreferencesControls />
          </div>
        </section>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border bg-[linear-gradient(145deg,color-mix(in_oklch,var(--safir)_10%,var(--card)),var(--card)_64%)] p-5 sm:p-6">
            <span className="grid size-10 place-items-center rounded-xl bg-safir text-safir-foreground shadow-sm">
              <Home className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-heading text-xl font-semibold">{t("website.title")}</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              {t("website.description")}
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
            >
              {t("website.action")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </section>

          <section className="rounded-xl border bg-card p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-safir/10 text-safir">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-xl font-semibold">{t("account.title")}</h2>
                <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
                  {t("account.description")}
                </p>
              </div>
            </div>
            <Link
              href="/settings/security"
              className="mt-5 flex min-h-11 items-center justify-between gap-3 rounded-lg border px-3 text-sm font-medium transition hover:border-safir/30 hover:bg-safir/5"
            >
              {t("account.action")}
              <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          </section>

          <section className="rounded-xl border bg-card p-5 sm:p-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-safir uppercase">
                {t("configuration.eyebrow")}
              </p>
              <h2 className="mt-1 font-heading text-xl font-semibold">{t("configuration.title")}</h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {t("configuration.description")}
              </p>
            </div>
            <dl className="mt-5 divide-y rounded-lg border">
              <div className="flex items-center gap-3 px-3 py-3">
                <Globe2 className="size-4 shrink-0 text-safir" aria-hidden="true" />
                <dt className="min-w-0 flex-1 text-sm text-muted-foreground">{t("configuration.languages")}</dt>
                <dd className="text-right text-xs font-semibold">{languages}</dd>
              </div>
              <div className="flex items-center gap-3 px-3 py-3">
                <Database className="size-4 shrink-0 text-safir" aria-hidden="true" />
                <dt className="min-w-0 flex-1 text-sm text-muted-foreground">{t("configuration.data")}</dt>
                <dd className="text-right text-xs font-semibold">Firebase</dd>
              </div>
              <div className="flex items-center gap-3 px-3 py-3">
                <Server className="size-4 shrink-0 text-safir" aria-hidden="true" />
                <dt className="min-w-0 flex-1 text-sm text-muted-foreground">{t("configuration.environment")}</dt>
                <dd className="text-right text-xs font-semibold">{environment}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
