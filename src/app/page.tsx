import { CardsSection } from "@/components/home/cards-section";
import { CollectionPreview } from "@/components/home/collection-preview";
import { Hero } from "@/components/home/hero";
import { SeasonFeature } from "@/components/home/season-feature";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { mockCards } from "@/constants/mock-cards";
import { resolveLocale } from "@/lib/i18n/locales";
import { messages } from "@/lib/i18n/messages";

interface HomePageProps {
  searchParams: Promise<{
    lang?: string | string[];
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const locale = resolveLocale(params.lang);
  const copy = messages[locale];

  return (
    <div lang={locale} className="min-h-screen overflow-x-clip">
      <Header locale={locale} copy={copy.header} />
      <main>
        <Hero locale={locale} copy={copy.hero} cards={mockCards} />
        <CardsSection
          locale={locale}
          copy={copy.cards}
          statLabels={copy.stats}
          cards={mockCards}
        />
        <SeasonFeature copy={copy.season} />
        <CollectionPreview copy={copy.collection} />
      </main>
      <Footer copy={copy.footer} navigation={copy.header} />
    </div>
  );
}
