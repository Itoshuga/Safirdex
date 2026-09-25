import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { CardDetail } from "@/components/cards/card-detail";
import { PublicHeader } from "@/components/layout/public-header";
import { getCardDetails } from "@/features/cards/server/codex-service";
import type { AppLocale } from "@/lib/i18n/locales";

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
}: {
  params: Promise<{ locale: AppLocale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const card = await getCardDetails(slug, locale);
  if (!card) notFound();

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <CardDetail card={card} />
    </div>
  );
}
