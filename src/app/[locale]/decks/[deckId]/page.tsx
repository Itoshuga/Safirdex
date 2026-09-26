import {
  ArrowLeft,
  Crown,
  Edit3,
  Layers3,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { DeckDeleteButton } from "@/components/decks/deck-delete-button";
import { PublicHeader } from "@/components/layout/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeckDetail } from "@/features/decks/server/deck-service";
import { Link } from "@/i18n/navigation";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

const GROUPS = ["combatant", "spell", "token", "commander"] as const;

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ locale: string; deckId: string }>;
}) {
  const { locale: rawLocale, deckId } = await params;
  const locale = resolveLocale(rawLocale);
  const [session, detail, list, status] = await Promise.all([
    getUserSession(),
    getTranslations({ locale, namespace: "Decks.detail" }),
    getTranslations({ locale, namespace: "Decks.list" }),
    getTranslations({ locale, namespace: "Decks.status" }),
  ]);
  const deck = await getDeckDetail(deckId, locale, session?.uid ?? null);
  if (!deck) notFound();
  const groups = GROUPS.map((kind) => ({
    kind,
    entries: deck.entries.filter((entry) => entry.card.gameplayKind === kind),
  })).filter((group) => group.entries.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="border-b">
          <div className="site-container py-8 sm:py-12">
            <Button variant="ghost" nativeButton={false} render={<Link href="/decks" />}>
              <ArrowLeft /> {detail("back")}
            </Button>
            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-center">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{status(deck.legalityStatus)}</Badge>
                  {deck.isOwner ? (
                    <>
                      <Badge variant="secondary">{status(deck.status)}</Badge>
                      <Badge variant="outline">{status(deck.visibility)}</Badge>
                    </>
                  ) : null}
                </div>
                <h1 className="mt-4 font-heading text-5xl font-semibold tracking-[-0.06em] sm:text-7xl">
                  {deck.name}
                </h1>
                <div className="mt-4 flex items-center gap-3">
                  {deck.author.avatarUrl ? (
                    <Image src={deck.author.avatarUrl} alt="" width={36} height={36} className="size-9 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-9 place-items-center rounded-full bg-muted"><UserRound className="size-4" /></span>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {list("by", { name: deck.author.displayName })} <span>@{deck.author.username}</span>
                  </p>
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">{deck.description}</p>
                {deck.isOwner ? (
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button nativeButton={false} render={<Link href={`/decks/${deck.id}/edit`} />}><Edit3 /> {detail("edit")}</Button>
                    <DeckDeleteButton deckId={deck.id} />
                  </div>
                ) : null}
              </div>
              <div className="relative aspect-[16/9] overflow-hidden rounded-3xl border bg-safir/7">
                {deck.artworkUrl ? (
                  <Image src={deck.artworkUrl} alt="" fill priority className="object-cover" sizes="28rem" />
                ) : (
                  <div className="grid h-full place-items-center"><Layers3 className="size-16 text-safir/30" /></div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="site-container grid gap-8 py-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <h2 className="font-heading text-3xl font-semibold">{detail("cards")}</h2>
            <div className="mt-6 space-y-8">
              {groups.map((group) => (
                <section key={group.kind}>
                  <h3 className="mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">{detail(`groups.${group.kind}`)}</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {group.entries.map((entry) => (
                      <article key={entry.cardId} className="overflow-hidden rounded-xl border bg-card">
                        <div className={entry.card.artwork.orientation === "horizontal" ? "relative aspect-[16/9]" : "relative aspect-[5/7]"}>
                          {entry.card.artwork.url ? <Image src={entry.card.artwork.url} alt="" fill className="object-cover" sizes="20vw" /> : null}
                          <Badge className="absolute top-2 left-2">{entry.quantity}×</Badge>
                        </div>
                        <div className="p-3"><h4 className="truncate text-sm font-semibold">{entry.card.name}</h4><p className="mt-1 text-xs text-muted-foreground">#{String(entry.card.number).padStart(3, "0")}</p></div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
          <aside className="space-y-4">
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="flex items-center gap-2 font-heading text-xl font-semibold"><Crown className="size-5 text-safir" /> {detail("commander")}</h2>
              {deck.commander ? (
                <>
                  <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-xl bg-muted">{deck.commander.artwork.url ? <Image src={deck.commander.artwork.url} alt="" fill className="object-cover" sizes="20rem" /> : null}</div>
                  <p className="mt-3 font-semibold">{deck.commander.name}</p>
                </>
              ) : <p className="mt-3 text-sm text-muted-foreground">{list("noCommander")}</p>}
            </div>
            {deck.factions.length ? (
              <div className="rounded-2xl border bg-card p-5">
                <h2 className="font-heading text-xl font-semibold">{detail("factions")}</h2>
                <div className="mt-3 flex flex-wrap gap-2">{deck.factions.map((faction) => <Badge key={faction.id} variant="outline" style={{ borderColor: faction.color, color: faction.color }}>{faction.name}</Badge>)}</div>
              </div>
            ) : null}
            <div className="rounded-2xl border bg-card p-5">
              <h2 className="flex items-center gap-2 font-heading text-xl font-semibold"><ShieldCheck className="size-5 text-safir" /> {detail("about")}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{detail("ruleset", { id: deck.ruleset.id, version: deck.ruleset.version })}</p>
              <p className="mt-2 text-sm font-medium">{list("cards", { count: deck.cardCount })}</p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
