"use client";

import { AlertCircle, Check, Crown, Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SAFIR_STANDARD_RULESET } from "@/features/decks/rules/ruleset";
import type { DeckCatalogCard, DeckRuleIssue, DeckRuleResult } from "@/features/decks/types";
import { cn } from "@/lib/utils";

type DeckEntryView = {
  cardId: string;
  quantity: number;
  card: DeckCatalogCard;
};

export function DeckSidebar({
  commander,
  entries,
  result,
  pending,
  dirty,
  issueText,
  onChangeCommander,
  onAdd,
  onRemove,
  onIntent,
}: {
  commander: DeckCatalogCard | null;
  entries: DeckEntryView[];
  result: DeckRuleResult;
  pending: boolean;
  dirty: boolean;
  issueText: (issue: DeckRuleIssue) => string;
  onChangeCommander: () => void;
  onAdd: (cardId: string) => void;
  onRemove: (cardId: string) => void;
  onIntent: (intent: "draft" | "publish") => void;
}) {
  const t = useTranslations("Decks.builder");
  const status = useTranslations("Decks.status");
  const progressTarget = result.cardCount < SAFIR_STANDARD_RULESET.deckSize.min ? SAFIR_STANDARD_RULESET.deckSize.min : SAFIR_STANDARD_RULESET.deckSize.max;
  const deckProgress = Math.min(100, (result.cardCount / progressTarget) * 100);
  const compatibleProgress = commander ? Math.min(100, (result.compatibleCombatantsCount / SAFIR_STANDARD_RULESET.commander.minimumFactionCombatants) * 100) : 0;
  const groups = (["combatant", "spell", "token"] as const).map((kind) => ({
    kind,
    entries: entries.filter((entry) => entry.card.gameplayKind === kind),
    count: entries.filter((entry) => entry.card.gameplayKind === kind).reduce((sum, entry) => sum + entry.quantity, 0),
  })).filter((group) => group.entries.length);

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{t("deckSummary")}</p><h2 className="mt-1 font-heading text-xl font-semibold">{t("mainDeck")}</h2></div>
          <Badge variant={result.isLegal ? "default" : "secondary"}>{status(result.status)}</Badge>
        </div>

        <div className="mt-5">
          <div className="flex items-end justify-between gap-3"><div><strong className="font-heading text-3xl font-semibold tabular-nums">{result.cardCount}</strong><span className="ml-1 text-sm text-muted-foreground">/ {progressTarget}</span></div><span className="text-xs font-medium text-muted-foreground">{result.cardCount < SAFIR_STANDARD_RULESET.deckSize.min ? t("minimumLabel") : t("maximumLabel")}</span></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full transition-[width]", result.isLegal ? "bg-emerald-500" : "bg-safir")} style={{ width: `${deckProgress}%` }} /></div>
          <p className="mt-2 text-[0.68rem] text-muted-foreground">{t("mainDeckCount", { count: result.mainDeckCardCount })}{commander ? ` · ${t("commanderCount", { count: 1 })}` : ""}</p>
        </div>
      </div>

      {commander ? (
        <div className="border-y bg-muted/25 p-4">
          <div className="flex items-center gap-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">{commander.artwork.url ? <Image src={commander.artwork.url} alt="" fill className="object-cover" sizes="3rem" /> : <Crown className="absolute inset-0 m-auto size-4 text-safir" />}</div>
            <div className="min-w-0 flex-1"><p className="text-[0.58rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{t("commander")}</p><p className="truncate text-sm font-semibold">{commander.name}</p></div>
            <Button type="button" size="xs" variant="ghost" onClick={onChangeCommander}>{t("change")}</Button>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs"><span>{t("compatibleCombatants")}</span><strong className="tabular-nums">{result.compatibleCombatantsCount}/{SAFIR_STANDARD_RULESET.commander.minimumFactionCombatants}{result.compatibleCombatantsCount >= SAFIR_STANDARD_RULESET.commander.minimumFactionCombatants ? " ✓" : ""}</strong></div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-safir transition-[width]" style={{ width: `${compatibleProgress}%` }} /></div>
        </div>
      ) : null}

      <div className="max-h-[48vh] overflow-y-auto px-3 py-2">
        {groups.length ? groups.map((group) => (
          <section key={group.kind} className="py-2">
            <h3 className="px-2 text-[0.62rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">{t(`groups.${group.kind}`, { count: group.count })}</h3>
            <div className="mt-1 space-y-0.5">
              {group.entries.map((entry) => (
                <div key={entry.cardId} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/55">
                  <div className="relative size-8 shrink-0 overflow-hidden rounded-md bg-muted">{entry.card.artwork.url ? <Image src={entry.card.artwork.url} alt="" fill className="object-cover" sizes="2rem" /> : null}</div>
                  <span className="w-6 shrink-0 text-center font-mono text-xs font-semibold">{entry.quantity}×</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">{entry.card.name}</span>
                  <div className="flex shrink-0 opacity-70 transition group-hover:opacity-100">
                    <button type="button" className="grid size-7 place-items-center rounded-md hover:bg-background" aria-label={t("remove")} onClick={() => onRemove(entry.cardId)}><Minus className="size-3" /></button>
                    <button type="button" className="grid size-7 place-items-center rounded-md text-safir hover:bg-background disabled:opacity-35" disabled={entry.quantity >= SAFIR_STANDARD_RULESET.maxCopiesPerGameplayCard || result.cardCount >= SAFIR_STANDARD_RULESET.deckSize.max} aria-label={t("add")} onClick={() => onAdd(entry.cardId)}><Plus className="size-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )) : <div className="px-5 py-10 text-center"><p className="text-sm text-muted-foreground">{t("emptyDeck")}</p></div>}
      </div>

      <div className="border-t p-4">
        {result.issues.length ? (
          <div className="rounded-xl bg-amber-500/7 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold"><AlertCircle className="size-3.5 text-amber-600" /> {t("toComplete")}</p>
            <ul className="mt-2 space-y-1.5 text-[0.68rem] leading-4 text-muted-foreground">{result.issues.map((issue, index) => <li key={`${issue.code}-${issue.cardId ?? index}`}>• {issueText(issue)}</li>)}</ul>
          </div>
        ) : (
          <div className="rounded-xl bg-emerald-500/8 p-3 text-emerald-700 dark:text-emerald-300"><p className="flex items-center gap-2 text-xs font-semibold"><Check className="size-3.5" /> {t("validDeck")}</p><p className="mt-1 text-[0.68rem] opacity-80">{t("validDeckDescription")}</p></div>
        )}

        <p className="mt-3 text-center text-[0.65rem] text-muted-foreground">{pending ? t("saving") : dirty ? t("unsavedChanges") : t("workingCopy")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button name="intent" value="draft" type="submit" variant="outline" disabled={pending} onClick={() => onIntent("draft")}>{t("save")}</Button>
          <Button name="intent" value="publish" type="submit" disabled={pending || !result.isLegal} onClick={() => onIntent("publish")}>{t("publish")}</Button>
        </div>
      </div>
    </div>
  );
}
