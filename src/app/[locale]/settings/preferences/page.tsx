import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PreferencesControls } from "@/components/settings/preferences-controls";
import { SettingsSection } from "@/components/settings/settings-section";
import { resolveLocale } from "@/lib/i18n/locales";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Settings.navigation" });
  return { title: t("preferences") };
}

export default async function PreferencesSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "Settings.preferences" });
  return (
    <SettingsSection eyebrow={t("eyebrow")} title={t("title")} description={t("description")}>
      <PreferencesControls />
    </SettingsSection>
  );
}
