import { ArrowUpRight, Layers3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { Messages } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

interface SeasonFeatureProps {
  copy: Messages["season"];
}

export function SeasonFeature({ copy }: SeasonFeatureProps) {
  return (
    <section id="seasons" className="scroll-mt-24 py-8 sm:py-16">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl shadow-black/5">
          <div className="grid min-h-[38rem] lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative z-10 flex flex-col justify-center p-7 sm:p-12 lg:p-16 xl:p-20">
              <p className="eyebrow">{copy.eyebrow}</p>
              <h2 className="mt-6 max-w-xl font-heading text-5xl leading-[0.92] font-semibold tracking-[-0.035em] text-balance sm:text-6xl xl:text-7xl">
                {copy.title}
              </h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
                {copy.description}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Badge variant="outline" className="h-8 gap-2 rounded-full px-3">
                  <Layers3 aria-hidden="true" />
                  {copy.cardCount}
                </Badge>
                <Link
                  href="#cards"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "rounded-full text-safir hover:text-safir",
                  )}
                >
                  {copy.cta}
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="relative min-h-[24rem] overflow-hidden border-t lg:min-h-full lg:border-t-0 lg:border-l">
              <Image
                src="/artwork/echoes-of-the-veil.svg"
                alt={copy.artworkAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover transition-transform duration-700 hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent lg:bg-gradient-to-r lg:from-card/20 lg:to-transparent" />
              <div className="absolute right-6 bottom-6 border border-white/15 bg-black/25 px-3 py-2 text-[0.6rem] font-semibold tracking-[0.2em] text-white/70 uppercase backdrop-blur-md">
                Season 01 · Preview
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
