import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CardDetail } from "@/components/cards/card-detail";
import { PublicHeader } from "@/components/layout/public-header";
import { getCardDetails } from "@/features/cards/server/codex-service";
import { emptyCollectionEntry } from "@/features/collection/domain";
import { getCardTraders, getCollectionEntry } from "@/features/collection/server/collection-service";
import type { AppLocale } from "@/lib/i18n/locales";
import { getUserSession } from "@/lib/auth/user-session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const [card, t] = await Promise.all([
    getCardDetails(slug, locale),
    getTranslations({ locale, namespace: "Cards.detail" }),
  ]);
  if (!card) return {};
  const title = t("metadataTitle", { name: card.name });
  const description = card.description || t("metadataFallback");

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/cards/${slug}`,
      languages: {
        fr: `/fr/cards/${slug}`,
        en: `/en/cards/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      ...(card.artwork.url ? { images: [{ url: card.artwork.url, alt: card.artwork.alt }] } : {}),
    },
  };
}

export default async function CardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale, slug }, query, session] = await Promise.all([params, searchParams, getUserSession()]);
  const card = await getCardDetails(slug, locale);
  if (!card) notFound();
  const tradersExpanded = query.traders === "all";
  const tradeCursor = Array.isArray(query.tradeCursor) ? query.tradeCursor[0] : query.tradeCursor;
  const [collectionEntry, traders] = await Promise.all([
    session && card.collectible ? getCollectionEntry(session.uid, card.id) : Promise.resolve(null),
    card.collectible ? getCardTraders(card.id, { limit: tradersExpanded ? 24 : 5, cursor: tradeCursor }) : Promise.resolve({ items: [], total: 0 }),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <CardDetail card={card} collectionEntry={collectionEntry ?? (session && card.collectible ? emptyCollectionEntry(card.id) : null)} signedIn={Boolean(session)} traders={traders} tradersExpanded={tradersExpanded} />
    </div>
  );
}
