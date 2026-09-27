import { redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/locales";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  return redirect({ href: "/settings/profile", locale });
}
