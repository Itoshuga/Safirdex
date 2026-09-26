import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DeckBuilder } from "@/components/decks/deck-builder";
import { PublicHeader } from "@/components/layout/public-header";
import { getCodexFilterOptions } from "@/features/cards/server/codex-service";
import { localizedLabel } from "@/features/admin/presentation";
import { deckCardsForBuilder, deckToBuilderDraft, getBuilderCatalogPage, getDeckById } from "@/features/decks/server/deck-service";
import { redirect } from "@/i18n/navigation";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";
import { factionsRepository } from "@/repositories/factions.repository";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EditDeckPage({ params }: { params: Promise<{ locale: string; deckId: string }> }) {
  const { locale: rawLocale, deckId } = await params;
  const locale = resolveLocale(rawLocale);
  const session = await getUserSession();
  if (!session) return redirect({ href: "/login", locale });
  const deck = await getDeckById(deckId);
  if (!deck || deck.authorId !== session.uid) notFound();
  const [t, cards, commanders, factions, filterOptions] = await Promise.all([
    getTranslations({ locale, namespace: "Decks.builder" }),
    getBuilderCatalogPage({ locale }),
    getBuilderCatalogPage({ locale, commanderOnly: true }),
    factionsRepository.getAll(),
    getCodexFilterOptions(locale),
  ]);
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="border-b bg-[linear-gradient(135deg,color-mix(in_oklch,var(--safir)_8%,transparent),transparent_62%)]">
          <div className="site-container py-8 sm:py-10">
            <p className="eyebrow">{t("eyebrow")}</p>
            <h1 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">{t("editTitle", { name: deck.name })}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t("description")}</p>
          </div>
        </section>
        <section className="site-container py-7 sm:py-10">
          <DeckBuilder
            locale={locale}
            initialDraft={deckToBuilderDraft(deck)}
            initialCatalogCards={cards.items}
            initialCommanderCards={commanders.items}
            initialSelectedCards={deckCardsForBuilder(deck, locale)}
            initialNextCursor={cards.nextCursor}
            initialCommanderNextCursor={commanders.nextCursor}
            factions={factions.map((faction) => ({ id: faction.id, label: localizedLabel(faction.translations, locale), ...(faction.visual?.color ? { color: faction.visual.color } : {}) }))}
            filterOptions={filterOptions}
          />
        </section>
      </main>
    </div>
  );
}
