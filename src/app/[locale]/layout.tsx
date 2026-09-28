import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MaintenanceAdminBanner } from "@/features/maintenance/components/maintenance-admin-banner";
import { MaintenanceScreen } from "@/features/maintenance/components/maintenance-screen";
import {
  isMaintenanceBypassPath,
  shouldRenderMaintenance,
} from "@/features/maintenance/access";
import { getMaintenanceConfig } from "@/features/maintenance/server/maintenance-service";
import { routing } from "@/i18n/routing";
import { getUserSession } from "@/lib/auth/user-session";
import { hasAdminClaim } from "@/lib/auth/claims";
import { resolveLocale } from "@/lib/i18n/locales";

import "../globals.css";

const interfaceFont = Inter({
  variable: "--font-interface",
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({ locale, namespace: "Home.metadata" });
  const languages = Object.fromEntries(
    routing.locales.map((supportedLocale) => [supportedLocale, `/${supportedLocale}`]),
  );

  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://safircodex.example",
    ),
    title: t("title"),
    description: t("description"),
    applicationName: "Safirdex",
    icons: { icon: "/brand/safir-logo.webp" },
    alternates: { canonical: `/${locale}`, languages },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      siteName: "Safirdex",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  const resolvedLocale = resolveLocale(locale);
  // Maintenance is runtime state. Waiting for a request prevents Next from
  // contacting Firestore while prerendering the application during a build.
  await connection();
  const maintenance = await getMaintenanceConfig();
  let content = children;

  if (maintenance.enabled) {
    const pathname =
      (await headers()).get("x-safirdex-pathname") ?? `/${resolvedLocale}`;

    if (!isMaintenanceBypassPath(pathname)) {
      const session = await getUserSession();
      content = shouldRenderMaintenance({
        enabled: true,
        pathname,
        isAdmin: Boolean(session && hasAdminClaim(session)),
      }) ? (
        <MaintenanceScreen config={maintenance} locale={resolvedLocale} />
      ) : (
        <>
          <MaintenanceAdminBanner />
          {children}
        </>
      );
    }
  }

  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${interfaceFont.variable} ${displayFont.variable} min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>
            <TooltipProvider delay={250}>{content}</TooltipProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
