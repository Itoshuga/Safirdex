import { ArrowUpRight, Crown, Layers3 } from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";

import { ProfileAvatar } from "@/components/community/profile-avatar";
import { Badge } from "@/components/ui/badge";
import type { DeckPreviewView } from "@/features/decks/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const legalityStyles: Record<DeckPreviewView["legalityStatus"], string> = {
  legal: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  incomplete: "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  invalid: "border-destructive/25 bg-destructive/12 text-destructive",
};

export function DeckPreview({ deck }: { deck: DeckPreviewView }) {
  const list = useTranslations("Decks.list");
  const status = useTranslations("Decks.status");
  const format = useFormatter();

  return (
    <article className="group min-w-0 overflow-hidden rounded-[1.35rem] border bg-card/80 transition duration-200 hover:border-safir/35 hover:shadow-[0_22px_50px_-38px_color-mix(in_oklch,var(--safir)_65%,transparent)]">
      <Link href={`/decks/${deck.id}`} className="flex h-full flex-col outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" prefetch={false}>
        <div className="relative aspect-[16/10] overflow-hidden bg-safir/7">
          {deck.artworkUrl ? (
            <Image
              src={deck.artworkUrl}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.025]"
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            />
          ) : (
            <div className="surface-grid absolute inset-0 grid place-items-center text-safir/35">
              <Layers3 className="size-11" aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/5 to-black/20" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <Badge variant="outline" className={cn("rounded-full backdrop-blur-md", legalityStyles[deck.legalityStatus])}>
              {status(deck.legalityStatus)}
            </Badge>
            {deck.status === "draft" ? <Badge className="rounded-full bg-background/88 text-foreground backdrop-blur-md">{status("draft")}</Badge> : null}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-4 py-3 text-white">
            <Crown className="size-3.5 shrink-0 text-white/75" aria-hidden="true" />
            <span className="truncate text-xs font-medium">
              {deck.commanderName ? list("commander", { name: deck.commanderName }) : list("noCommander")}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 truncate font-heading text-xl font-semibold tracking-[-0.03em]">{deck.name}</h2>
            <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-safir" aria-hidden="true" />
          </div>
          <div className="mt-3 flex min-w-0 items-center gap-2.5">
            <ProfileAvatar src={deck.author.avatarUrl} name={deck.author.displayName} className="size-7 border-0 text-[0.68rem] shadow-none" />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{deck.author.displayName}</p>
              <p className="truncate text-[0.65rem] text-muted-foreground">@{deck.author.username}</p>
            </div>
            <span className="ml-auto shrink-0 text-[0.65rem] text-muted-foreground">
              {format.dateTime(new Date(deck.updatedAtIso), { dateStyle: "medium" })}
            </span>
          </div>

          <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{deck.description || "—"}</p>

          {deck.factions.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {deck.factions.slice(0, 3).map((faction) => (
                <span key={faction.id} className="inline-flex h-6 items-center gap-1.5 rounded-full border bg-background/65 px-2.5 text-[0.65rem] font-medium">
                  <span className="size-1.5 rounded-full bg-current" style={{ color: faction.color }} aria-hidden="true" />
                  {faction.name}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-auto grid grid-cols-2 border-t pt-4 text-xs">
            <div>
              <p className="text-[0.62rem] text-muted-foreground">{list("cardsLabel")}</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{deck.cardCount}</p>
            </div>
            <div className="border-l pl-4">
              <p className="text-[0.62rem] text-muted-foreground">{list("uniqueCardsLabel")}</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{deck.uniqueCardCount}</p>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
