import { Check, MailCheck } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EmailVerificationHandler } from "@/components/auth/email-verification-handler";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SafirLogo } from "@/components/layout/safir-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/locales";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Auth.emailVerification.metadata" });

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  };
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ oobCode?: string | string[] }>;
}) {
  const t = await getTranslations("Auth");
  const { oobCode } = await searchParams;
  const actionCode = Array.isArray(oobCode) ? oobCode[0] : oobCode;
  const steps = [
    { label: t("steps.credentials"), state: "complete" },
    { label: t("steps.verification"), state: "active" },
    { label: t("steps.profile"), state: "upcoming" },
  ] as const;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-45 dark:opacity-20" />
      <div className="pointer-events-none absolute top-[-18rem] left-1/2 h-[36rem] w-[48rem] -translate-x-1/2 rounded-full bg-safir/12 blur-[120px]" />

      <header className="relative z-10 mx-auto flex h-20 max-w-[90rem] items-center justify-between border-b border-border/55 px-5 sm:px-8 lg:px-12">
        <Link href="/" className="group inline-flex items-center gap-3 text-sm font-semibold">
          <SafirLogo className="size-8" />
          Safirdex
        </Link>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] w-full max-w-3xl items-center px-5 py-10 sm:px-8 sm:py-16">
        <section className="w-full overflow-hidden rounded-2xl border bg-card/95 shadow-[0_32px_90px_-44px_rgba(15,23,42,0.55)] backdrop-blur-xl">
          <ol
            className="grid grid-cols-3 border-b bg-muted/25 px-3 py-4 sm:px-8"
            aria-label={t("steps.label")}
          >
            {steps.map((step, index) => (
              <li className="relative flex min-w-0 flex-col items-center gap-2 text-center" key={step.label}>
                {index > 0 ? (
                  <span className="absolute top-3.5 right-1/2 h-px w-full -translate-x-3.5 bg-border" aria-hidden="true" />
                ) : null}
                <span
                  className={
                    step.state === "complete"
                      ? "relative z-10 grid size-7 place-items-center rounded-full bg-emerald-500 text-white"
                      : step.state === "active"
                        ? "relative z-10 grid size-7 place-items-center rounded-full bg-safir text-safir-foreground ring-4 ring-safir/10"
                        : "relative z-10 grid size-7 place-items-center rounded-full border bg-card text-[0.65rem] font-semibold text-muted-foreground"
                  }
                >
                  {step.state === "complete" ? <Check className="size-3.5" aria-hidden="true" /> : step.state === "active" ? <MailCheck className="size-3.5" aria-hidden="true" /> : index + 1}
                </span>
                <span className={step.state === "upcoming" ? "truncate text-[0.65rem] font-medium text-muted-foreground" : "truncate text-[0.65rem] font-semibold text-foreground"}>
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
          <EmailVerificationHandler actionCode={actionCode} />
        </section>
      </div>
    </main>
  );
}
