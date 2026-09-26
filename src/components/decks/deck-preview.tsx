import { Crown, Layers3, UserRound } from "lucide-react";
import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { DeckPreviewView } from "@/features/decks/types";
import { Link } from "@/i18n/navigation";

export function DeckPreview({ deck }: { deck: DeckPreviewView }) {
  const list = useTranslations("Decks.list");
  const status = useTranslations("Decks.status");
  const format = useFormatter();

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border bg-card transition hover:-translate-y-0.5 hover:border-safir/40 hover:shadow-lg">
      <Link href={`/decks/${deck.id}`} className="block h-full" prefetch={false}>
        <div className="relative aspect-[16/9] overflow-hidden bg-safir/7">
          {deck.artworkUrl ? (
            <Image
              src={deck.artworkUrl}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
            />
          ) : (
            <div className="grid h-full place-items-center text-safir/35"><Layers3 className="size-12" /></div>
          )}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <Badge className="bg-background/90 text-foreground backdrop-blur">{status(deck.legalityStatus)}</Badge>
            {deck.status === "draft" ? <Badge variant="secondary">{status("draft")}</Badge> : null}
          </div>
        </div>
        <div className="p-4">
          <h2 className="truncate font-heading text-xl font-semibold tracking-[-0.03em]">{deck.name}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><UserRound className="size-3.5" /> {list("by", { name: deck.author.displayName })} · @{deck.author.username}</p>
          <p className="mt-1 text-[0.68rem] text-muted-foreground">{list("updatedAt", { date: format.dateTime(new Date(deck.updatedAtIso), { dateStyle: "medium" }) })}</p>
          <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{deck.description || "—"}</p>
          {deck.factions.length ? <div className="mt-3 flex flex-wrap gap-1">{deck.factions.slice(0, 3).map((faction) => <Badge key={faction.id} variant="outline" style={{ borderColor: faction.color, color: faction.color }}>{faction.name}</Badge>)}</div> : null}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
            <span className="font-semibold">{list("cards", { count: deck.cardCount })}</span>
            <span className="flex items-center gap-1 text-muted-foreground"><Crown className="size-3.5" /> {deck.commanderName ? list("commander", { name: deck.commanderName }) : list("noCommander")}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
