import { ArrowRight, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CardTraderRow } from "@/components/collection/card-trader-row";
import { Button } from "@/components/ui/button";
import type { CardTraderPage } from "@/features/collection/types";
import { Link } from "@/i18n/navigation";

export async function CardTradersSection({
  traders,
  cardSlug,
  expanded,
}: {
  traders: CardTraderPage;
  cardSlug: string;
  expanded: boolean;
}) {
  const t = await getTranslations("Collection.traders");
  return (
    <section className="mt-16 border-t pt-10">
      <p className="eyebrow">{t("eyebrow")}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em]">{t("title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <span className="rounded-full border bg-card px-3 py-1.5 text-xs font-semibold">{t("count", { count: traders.total })}</span>
      </div>
      {traders.items.length ? (
        <ul className="mt-6 grid gap-2 lg:grid-cols-2">
          {traders.items.map((trader) => <CardTraderRow key={trader.userId} trader={trader} />)}
        </ul>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
          <Users className="mx-auto size-8 opacity-50" />
          <p className="mt-3 text-sm">{t("empty")}</p>
        </div>
      )}
      {!expanded && traders.total > traders.items.length ? (
        <Button className="mt-5" variant="outline" nativeButton={false} render={<Link href={`/cards/${cardSlug}?traders=all`} />}>
          {t("showAll")} <ArrowRight />
        </Button>
      ) : expanded && traders.nextCursor ? (
        <Button className="mt-5" variant="outline" nativeButton={false} render={<Link href={`/cards/${cardSlug}?traders=all&tradeCursor=${encodeURIComponent(traders.nextCursor)}`} />}>
          {t("next")} <ArrowRight />
        </Button>
      ) : null}
    </section>
  );
}
