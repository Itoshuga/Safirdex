import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { buttonVariants } from "@/components/ui/button";
import { getLocalizedValue } from "@/lib/i18n/get-localized-value";
import type { AppLocale } from "@/lib/i18n/locales";
import type { Messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import type { CardPreviewData } from "@/types/card-preview";

interface HeroProps {
  locale: AppLocale;
  copy: Messages["hero"];
  cards: CardPreviewData[];
}

interface HeroCardProps {
  card: CardPreviewData;
  locale: AppLocale;
  className: string;
  rotation: string;
}

function HeroCard({
  card,
  locale,
  className,
  rotation,
}: HeroCardProps) {
  const translation = getLocalizedValue(card.translations, locale) ?? {
    name: `Card #${card.number}`,
    description: "",
  };
  const artworkAlt = getLocalizedValue(card.artwork.alt, locale) ?? "";

  return (
    <article
      className={`card-drift absolute overflow-hidden rounded-2xl border border-white/15 bg-card shadow-2xl shadow-black/30 ${className}`}
      style={{ "--card-rotation": rotation } as CSSProperties}
    >
      <div className="relative h-full w-full">
        <Image
          src={card.artwork.url}
          alt={artworkAlt}
          fill
          loading="eager"
          sizes="(max-width: 1024px) 54vw, 24vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071017] via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="text-[0.6rem] font-semibold tracking-[0.18em] text-[#b9d7d1] uppercase">
            #{String(card.number).padStart(3, "0")}
          </p>
          <h2 className="mt-1 font-heading text-2xl font-semibold">
            {translation.name}
          </h2>
        </div>
      </div>
    </article>
  );
}

export function Hero({ locale, copy, cards }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/70">
      <div className="surface-grid pointer-events-none absolute inset-0 opacity-55" />
      <div className="mineral-glow pointer-events-none absolute top-16 right-[-12rem] size-[42rem] rounded-full" />
      <div className="site-container relative grid min-h-[calc(100svh-4.75rem)] items-center gap-10 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-20 xl:gap-20">
        <div className="relative z-10 max-w-2xl">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 className="mt-7 font-heading text-[clamp(3.4rem,8vw,7.5rem)] leading-[0.78] font-semibold tracking-[-0.055em] text-balance">
            {copy.title}
            <span className="mt-2 block text-safir">{copy.titleAccent}</span>
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {copy.description}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="#cards"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 rounded-full bg-safir px-6 text-safir-foreground shadow-lg shadow-safir/15 hover:bg-safir/85",
              )}
            >
              {copy.primaryCta}
              <ArrowDownRight aria-hidden="true" />
            </Link>
            <Link
              href="#seasons"
              className={cn(
                buttonVariants({ size: "lg", variant: "outline" }),
                "h-12 rounded-full border-border/80 bg-background/40 px-6 backdrop-blur-sm",
              )}
            >
              {copy.secondaryCta}
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/70 pt-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Sparkles aria-hidden="true" className="size-3.5 text-ember" />
              {copy.curatedLabel}
            </span>
            <span className="hidden h-3 w-px bg-border sm:block" />
            <span className="tracking-[0.15em] uppercase">FR · EN</span>
          </div>
        </div>

        <div className="relative mx-auto h-[32rem] w-full max-w-[38rem] sm:h-[40rem] lg:h-[46rem]">
          <div className="absolute top-1/2 left-1/2 size-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-safir/15" />
          <div className="absolute top-1/2 left-1/2 size-[58%] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-safir/10" />
          <div className="absolute top-7 right-0 z-20 rounded-full border border-border/60 bg-background/65 px-4 py-2 text-[0.62rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase backdrop-blur-md sm:right-8">
            {copy.archiveLabel}
          </div>
          {cards[1] ? (
            <HeroCard
              card={cards[1]}
              locale={locale}
              rotation="-10deg"
              className="card-drift-delayed top-[22%] left-[2%] z-0 h-[55%] w-[40%] opacity-60 sm:left-[5%]"
            />
          ) : null}
          {cards[2] ? (
            <HeroCard
              card={cards[2]}
              locale={locale}
              rotation="11deg"
              className="card-drift-delayed top-[17%] right-[2%] z-10 h-[60%] w-[42%] opacity-80 sm:right-[5%]"
            />
          ) : null}
          {cards[0] ? (
            <HeroCard
              card={cards[0]}
              locale={locale}
              rotation="2deg"
              className="top-[10%] left-1/2 z-20 h-[69%] w-[48%] -translate-x-1/2"
            />
          ) : null}
          <div className="absolute right-[8%] bottom-[8%] z-30 w-48 border-l border-safir/50 bg-background/70 p-4 backdrop-blur-lg sm:w-56">
            <p className="font-heading text-xl leading-tight">
              128 <span className="text-muted-foreground">cards</span>
            </p>
            <p className="mt-1 text-[0.6rem] tracking-[0.18em] text-muted-foreground uppercase">
              Echoes of the Veil
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
