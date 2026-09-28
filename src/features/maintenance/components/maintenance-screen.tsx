import { LockKeyhole, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LanguageSwitcher } from "@/components/language-switcher";
import { SafirLogo } from "@/components/layout/safir-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MaintenanceRetryButton } from "@/features/maintenance/components/maintenance-retry-button";
import { MaintenanceTiming } from "@/features/maintenance/components/maintenance-timing";
import type { MaintenanceConfig } from "@/features/maintenance/types";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/lib/i18n/locales";

export async function MaintenanceScreen({
  config,
  locale,
}: {
  config: MaintenanceConfig;
  locale: AppLocale;
}) {
  const t = await getTranslations({ locale, namespace: "Maintenance.screen" });
  const content = config.translations[locale];
  const showTiming = config.showEstimatedEnd && config.estimatedEndAtIso;

  return (
    <main className="relative isolate min-h-dvh overflow-hidden bg-[#080b17] text-white">
      <meta name="robots" content="noindex,nofollow,noarchive" />
      <div
        className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_18%_18%,rgba(75,103,255,0.24),transparent_31%),radial-gradient(circle_at_82%_74%,rgba(112,67,196,0.18),transparent_35%),linear-gradient(145deg,#0b1022_0%,#080b17_55%,#0b0d18_100%)]"
        aria-hidden="true"
      />
      <div
        className="surface-grid absolute inset-0 -z-20 opacity-[0.12] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]"
        aria-hidden="true"
      />
      <div
        className="absolute top-[18%] left-1/2 -z-10 size-[32rem] -translate-x-1/2 rounded-full bg-safir/12 blur-[110px]"
        aria-hidden="true"
      />

      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <SafirLogo className="size-8 invert" />
          <span className="font-heading text-sm font-semibold tracking-[-0.02em]">
            Safirdex
          </span>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1 backdrop-blur-md [&_button]:text-white [&_button]:hover:bg-white/10">
          <LanguageSwitcher compact />
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-10rem)] w-full max-w-3xl place-items-center px-5 py-12 text-center sm:px-8">
        <section aria-labelledby="maintenance-title" className="w-full">
          <div className="mx-auto grid size-20 place-items-center rounded-[1.7rem] border border-white/12 bg-white/[0.07] shadow-[0_30px_90px_rgba(35,61,190,0.28)] backdrop-blur-xl motion-safe:animate-[pulse_4s_ease-in-out_infinite]">
            <SafirLogo className="size-11 invert" />
          </div>
          <p className="mt-8 inline-flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.16em] text-blue-200/75 uppercase">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {t("eyebrow")}
          </p>
          <h1
            id="maintenance-title"
            className="mx-auto mt-4 max-w-2xl font-heading text-4xl leading-[1.08] font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
          >
            {content.title}
          </h1>
          <p className="mx-auto mt-5 max-w-xl whitespace-pre-line text-[0.95rem] leading-7 text-white/64 sm:text-base">
            {content.message}
          </p>

          {showTiming ? (
            <MaintenanceTiming
              estimatedEndAtIso={showTiming}
              locale={locale}
              estimatedLabel={t("estimatedReturn")}
              countdownLabel={t("countdown")}
            />
          ) : null}

          <MaintenanceRetryButton
            label={t("retry")}
            pendingLabel={t("retrying")}
          />
          <p className="mt-5 text-xs text-white/40">{t("retryHelp")}</p>
        </section>
      </div>

      <footer className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between border-t border-white/8 px-5 text-xs text-white/35 sm:px-8">
        <span>{t("footer")}</span>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-white/5 hover:text-white/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          {t("adminAccess")}
        </Link>
      </footer>
    </main>
  );
}
