import { MinimalHome } from "@/components/home/minimal-home";
import { getHomeCodexCards } from "@/features/cards/server/codex-service";
import { getUserSession } from "@/lib/auth/user-session";
import type { AppLocale } from "@/lib/i18n/locales";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const [session, cards] = await Promise.all([
    getUserSession(),
    getHomeCodexCards(locale),
  ]);

  return (
    <MinimalHome
      cards={cards}
      signedIn={Boolean(session)}
    />
  );
}
