import { Library } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CollectionQuantityControls } from "@/components/collection/collection-quantity-controls";
import { Button } from "@/components/ui/button";
import type { CollectionEntryState } from "@/features/collection/types";
import { Link } from "@/i18n/navigation";

export async function CardCollectionPanel({
  cardId,
  cardName,
  entry,
  signedIn,
  collectible,
}: {
  cardId: string;
  cardName: string;
  entry: CollectionEntryState | null;
  signedIn: boolean;
  collectible: boolean;
}) {
  const t = await getTranslations("Collection");
  return (
    <section className="mt-7 max-w-lg rounded-2xl border bg-card px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-2">
        <Library className="size-3.5 text-safir" aria-hidden="true" />
        <h2 className="text-xs font-semibold">{t("detail.title")}</h2>
      </div>
      <div className="mt-1">
        {!collectible ? (
          <p className="py-2 text-xs text-muted-foreground">{t("quantity.notCollectible")}</p>
        ) : signedIn && entry ? (
          <CollectionQuantityControls cardId={cardId} cardName={cardName} initialEntry={entry} detailLayout />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 py-2">
            <p className="text-xs text-muted-foreground">{t("detail.signIn")}</p>
            <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/login" />}>{t("detail.signInAction")}</Button>
          </div>
        )}
      </div>
    </section>
  );
}
