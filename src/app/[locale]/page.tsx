import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";

import { MinimalHome } from "@/components/home/minimal-home";
import { getSiteHeaderUser } from "@/components/layout/site-header-user";
import { getHomeCodexCards } from "@/features/cards/server/codex-service";
import { routing } from "@/i18n/routing";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  const [user, cards] = await Promise.all([
    getSiteHeaderUser(),
    getHomeCodexCards(locale),
  ]);

  return (
    <MinimalHome
      cards={cards}
      user={user}
    />
  );
}
