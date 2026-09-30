import { Layers3, Plus, Sparkles, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function DeckDirectoryHeader({
  scope,
  signedIn,
}: {
  scope: "community" | "mine";
  signedIn: boolean;
}) {
  const hero = useTranslations("Decks.hero");
  const list = useTranslations("Decks.list");

  return (
    <section className="relative border-b">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="surface-grid absolute inset-0 opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="absolute -top-44 left-[12%] size-80 rounded-full bg-safir/10 blur-3xl" />
      </div>

      <div className="site-container relative py-9 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(26rem,1.1fr)] lg:items-end">
          <div>
            <p className="eyebrow">{hero("eyebrow")}</p>
            <h1 className="mt-3 max-w-3xl font-heading text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
              {hero("title")}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              {hero("description")}
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/88 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-safir/10 text-safir">
                <Layers3 className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                  {hero("builderEyebrow")}
                </p>
                <p className="mt-1 font-heading text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
                  {hero("builderTitle")}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4 border-t bg-muted/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="max-w-md text-xs leading-5 text-muted-foreground">
                {hero("builderDescription")}
              </p>
              <Button
                size="lg"
                className="rounded-full px-4"
                nativeButton={false}
                render={<Link href={signedIn ? "/decks/new" : "/login"} />}
              >
                <Plus /> {hero("create")}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-4">
          <nav aria-label={hero("navigationLabel")} className="flex gap-1 overflow-x-auto">
            <Link
              href="/decks"
              aria-current={scope === "community" ? "page" : undefined}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                scope === "community"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {list("community")}
            </Link>
            {signedIn ? (
              <Link
                href="/decks?scope=mine"
                aria-current={scope === "mine" ? "page" : undefined}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  scope === "mine"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <UserRound className="size-4" aria-hidden="true" />
                {list("mine")}
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
    </section>
  );
}
