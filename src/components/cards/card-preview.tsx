import { Gem, Shield, Swords } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card as UiCard } from "@/components/ui/card";
import { getLocalizedValue } from "@/lib/i18n/get-localized-value";
import type { AppLocale } from "@/lib/i18n/locales";
import type { Messages } from "@/lib/i18n/messages";
import type { CardPreviewData } from "@/types/card";

interface CardPreviewProps {
  card: CardPreviewData;
  locale: AppLocale;
  labels: Messages["stats"];
}

const statIcons = {
  attack: Swords,
  value: Gem,
  defense: Shield,
};

export function CardPreview({ card, locale, labels }: CardPreviewProps) {
  const translation = getLocalizedValue(card.translations, locale);
  const rarity = getLocalizedValue(card.rarity, locale);
  const types = getLocalizedValue(card.types, locale);
  const artworkAlt = getLocalizedValue(card.artwork.alt, locale);
  const stats = [
    { key: "attack" as const, value: card.attack },
    { key: "value" as const, value: card.value },
    { key: "defense" as const, value: card.defense },
  ];

  return (
    <UiCard className="group gap-0 overflow-hidden rounded-2xl py-0 ring-border transition-[transform,box-shadow,ring-color] duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-safir/10 hover:ring-safir/35">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <Image
          src={card.artwork.url}
          alt={artworkAlt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-black/5" />
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {card.isCommander ? (
            <Badge className="border-white/15 bg-black/35 text-[0.6rem] tracking-[0.12em] text-white uppercase backdrop-blur-md">
              Commander
            </Badge>
          ) : null}
          {card.isPromo ? (
            <Badge className="border-white/15 bg-black/35 text-[0.6rem] tracking-[0.12em] text-white uppercase backdrop-blur-md">
              Promo
            </Badge>
          ) : null}
        </div>
        <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2 transition-all duration-300 lg:translate-y-3 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100">
          {stats.map((stat) => {
            const Icon = statIcons[stat.key];

            return (
              <div
                key={stat.key}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-black/40 px-2 py-2 text-white backdrop-blur-md"
                title={labels[stat.key]}
              >
                <Icon aria-hidden="true" className="size-3.5 text-[#b4d4ce]" />
                <span className="text-sm font-semibold">{stat.value}</span>
                <span className="sr-only">{labels[stat.key]}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.65rem] font-semibold tracking-[0.18em] text-safir uppercase">
              {rarity}
            </p>
            <h3 className="mt-1.5 font-heading text-2xl leading-tight font-semibold">
              {translation.name}
            </h3>
          </div>
          <span className="pt-1 font-heading text-sm text-muted-foreground">
            #{String(card.number).padStart(3, "0")}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {types.map((type) => (
            <Badge key={type} variant="outline" className="text-muted-foreground">
              {type}
            </Badge>
          ))}
        </div>
      </div>
    </UiCard>
  );
}
