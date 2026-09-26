"use client";

import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initialCommunityActionState } from "@/features/community/action-state";
import {
  updatePrivacyAction,
} from "@/features/community/server/actions";
import type { PublicProfileVisibility } from "@/features/community/types";

export function PrivacyForm({ visibility }: { visibility: PublicProfileVisibility }) {
  const t = useTranslations("Profile.privacy");
  const [state, action, pending] = useActionState(updatePrivacyAction, initialCommunityActionState);
  const settings = [
    ["publicProfile", visibility.publicProfile],
    ["decks", visibility.decks === "public"],
    ["collection", visibility.collection === "public"],
    ["activity", visibility.activity === "public"],
  ] as const;

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-7">
      <p className="eyebrow">{t("eyebrow")}</p>
      <h2 className="mt-3 flex items-center gap-2 font-heading text-2xl font-semibold"><ShieldCheck className="size-5 text-safir" /> {t("title")}</h2>
      <form action={action} className="mt-6 space-y-3">
        {settings.map(([key, checked]) => (
          <label key={key} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 transition hover:bg-muted/35">
            <span>
              <span className="block text-sm font-semibold">{t(`${key}.label`)}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{t(`${key}.description`)}</span>
            </span>
            <input type="checkbox" name={key} defaultChecked={checked} className="mt-1 size-4 accent-safir" />
          </label>
        ))}
        {state.status === "error" ? <p className="admin-error">{t("failed")}</p> : null}
        {state.status === "success" ? <p className="flex items-center gap-2 text-sm text-emerald-600"><CheckCircle2 className="size-4" /> {t("saved")}</p> : null}
        <Button type="submit" size="lg" disabled={pending} className="mt-2">
          {pending ? <LoaderCircle className="animate-spin" /> : null} {t("save")}
        </Button>
      </form>
    </section>
  );
}
