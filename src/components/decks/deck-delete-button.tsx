"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { deleteDeckAction } from "@/app/[locale]/decks/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export function DeckDeleteButton({ deckId }: { deckId: string }) {
  const t = useTranslations("Decks.detail");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  return (
    <div>
      <Button
        type="button"
        variant="destructive"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(t("deleteConfirm"))) return;
          setError(false);
          startTransition(async () => {
            try {
              await deleteDeckAction(deckId);
              router.push("/decks");
              router.refresh();
            } catch {
              setError(true);
            }
          });
        }}
      >
        <Trash2 /> {t("delete")}
      </Button>
      {error ? <p className="mt-2 text-xs text-destructive" role="alert">{t("deleteError")}</p> : null}
    </div>
  );
}
