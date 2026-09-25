import { ArrowUpRight } from "lucide-react";

import { CardPreview } from "@/components/cards/card-preview";
import { SectionHeading } from "@/components/home/section-heading";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/lib/i18n/locales";
import type { Messages } from "@/lib/i18n/messages";
import type { CardPreviewData } from "@/types/card";

interface CardsSectionProps {
  locale: AppLocale;
  copy: Messages["cards"];
  statLabels: Messages["stats"];
  cards: CardPreviewData[];
}

export function CardsSection({
  locale,
  copy,
  statLabels,
  cards,
}: CardsSectionProps) {
  return (
    <section id="cards" className="scroll-mt-24 py-24 sm:py-32">
      <div className="site-container">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            eyebrow={copy.eyebrow}
            title={copy.title}
            description={copy.description}
          />
          <Button
            type="button"
            variant="ghost"
            disabled
            className="hidden self-end rounded-full text-muted-foreground md:flex"
            title="Coming soon"
          >
            {copy.browse}
            <ArrowUpRight aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <CardPreview
              key={card.id}
              card={card}
              locale={locale}
              labels={statLabels}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
