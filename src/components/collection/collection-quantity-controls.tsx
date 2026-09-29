"use client";

import { LoaderCircle, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { collectionEntryState } from "@/features/collection/domain";
import {
  adjustOwnedQuantityAction,
  adjustTradeQuantityAction,
} from "@/features/collection/server/actions";
import type { CollectionEntryState } from "@/features/collection/types";

export function CollectionQuantityControls({
  cardId,
  cardName,
  initialEntry,
  compact = false,
  compactVariant = "bar",
  detailLayout = false,
  onChange,
}: {
  cardId: string;
  cardName: string;
  initialEntry: CollectionEntryState;
  compact?: boolean;
  compactVariant?: "bar" | "floating" | "inline";
  detailLayout?: boolean;
  onChange?: (entry: CollectionEntryState) => void;
}) {
  const t = useTranslations("Collection.quantity");
  const [entry, setEntry] = useState(initialEntry);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function commit(next: CollectionEntryState) {
    setEntry(next);
    onChange?.(next);
  }

  function adjustOwned(delta: -1 | 1) {
    if (pending || (delta < 0 && entry.ownedQuantity === 0)) return;
    const previous = entry;
    commit(collectionEntryState(cardId, entry.ownedQuantity + delta, entry.tradeQuantity));
    setMessage("");
    startTransition(async () => {
      const result = await adjustOwnedQuantityAction({ cardId, delta });
      if (!result.ok) {
        commit(previous);
        setMessage(t("error"));
        return;
      }
      commit(result.entry);
      setMessage(t("saved"));
    });
  }

  function adjustTrade(delta: -1 | 1) {
    if (
      pending ||
      (delta < 0 && entry.tradeQuantity === 0) ||
      (delta > 0 && entry.tradeQuantity >= entry.duplicateQuantity)
    ) return;
    const previous = entry;
    commit(collectionEntryState(cardId, entry.ownedQuantity, entry.tradeQuantity + delta));
    setMessage("");
    startTransition(async () => {
      const result = await adjustTradeQuantityAction({ cardId, delta });
      if (!result.ok) {
        commit(previous);
        setMessage(result.code === "TRADE_EXCEEDS_DUPLICATES" ? t("tradeLimit") : t("error"));
        return;
      }
      commit(result.entry);
      setMessage(t("saved"));
    });
  }

  if (compact) {
    if (compactVariant === "floating") {
      return (
        <div className="inline-flex items-center rounded-full border border-white/20 bg-background/88 p-1 shadow-lg shadow-black/15 backdrop-blur-xl">
          {entry.ownedQuantity > 0 ? (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="rounded-full"
              disabled={pending}
              onClick={() => adjustOwned(-1)}
              aria-label={t("remove", { name: cardName })}
            >
              <Minus />
            </Button>
          ) : null}
          {entry.ownedQuantity > 0 ? (
            <span className="min-w-7 text-center font-mono text-xs font-semibold tabular-nums">
              {pending ? <LoaderCircle className="mx-auto size-3 animate-spin" /> : entry.ownedQuantity}
            </span>
          ) : null}
          <Button
            type="button"
            size={entry.ownedQuantity > 0 ? "icon-xs" : "sm"}
            variant={entry.ownedQuantity > 0 ? "ghost" : "default"}
            className="rounded-full"
            disabled={pending}
            onClick={() => adjustOwned(1)}
            aria-label={t("add", { name: cardName })}
          >
            {pending && entry.ownedQuantity === 0 ? <LoaderCircle className="animate-spin" /> : <Plus />}
            {entry.ownedQuantity === 0 ? <span>{t("quickAddShort")}</span> : null}
          </Button>
          <span className="sr-only" aria-live="polite">{message}</span>
        </div>
      );
    }

    return (
      <div className={`flex min-h-11 items-center justify-between gap-2 px-3 py-2 ${compactVariant === "bar" ? "border-t bg-muted/20" : "sm:h-full sm:flex-col sm:justify-center sm:px-3"}`}>
        <span className="min-w-0 truncate text-[0.68rem] font-semibold text-muted-foreground">
          {entry.ownedQuantity > 0 ? `${t("owned")} · ${entry.ownedQuantity}` : t("quickAdd")}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {entry.ownedQuantity > 0 ? (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              disabled={pending}
              onClick={() => adjustOwned(-1)}
              aria-label={t("remove", { name: cardName })}
            >
              <Minus />
            </Button>
          ) : null}
          <span className="min-w-5 text-center font-mono text-xs font-semibold tabular-nums">
            {pending ? <LoaderCircle className="mx-auto size-3 animate-spin" /> : entry.ownedQuantity}
          </span>
          <Button
            type="button"
            size="icon-xs"
            variant={entry.ownedQuantity > 0 ? "ghost" : "default"}
            disabled={pending}
            onClick={() => adjustOwned(1)}
            aria-label={t("add", { name: cardName })}
          >
            <Plus />
          </Button>
        </div>
        <span className="sr-only" aria-live="polite">{message}</span>
      </div>
    );
  }

  if (detailLayout) {
    const hasError = Boolean(message && message !== t("saved"));
    return (
      <div>
        <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="flex items-center justify-between gap-3 py-1.5 sm:pr-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold">{t("owned")}</p>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{t("duplicates", { count: entry.duplicateQuantity })}</p>
            </div>
            <QuantityButtons
              value={entry.ownedQuantity}
              pending={pending}
              minusDisabled={entry.ownedQuantity === 0}
              plusDisabled={false}
              minusLabel={t("remove", { name: cardName })}
              plusLabel={t("add", { name: cardName })}
              onMinus={() => adjustOwned(-1)}
              onPlus={() => adjustOwned(1)}
            />
          </div>
          <div className="flex items-center justify-between gap-3 py-1.5 sm:pl-4">
            <p className="text-xs font-semibold">{t("trade")}</p>
            <QuantityButtons
              value={entry.tradeQuantity}
              pending={pending}
              minusDisabled={entry.tradeQuantity === 0}
              plusDisabled={entry.tradeQuantity >= entry.duplicateQuantity}
              minusLabel={t("removeTrade", { name: cardName })}
              plusLabel={t("addTrade", { name: cardName })}
              onMinus={() => adjustTrade(-1)}
              onPlus={() => adjustTrade(1)}
            />
          </div>
        </div>
        <p className={hasError ? "mt-2 text-[0.68rem] text-destructive" : "sr-only"} aria-live="polite">
          {message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border bg-background/65 p-3">
        <div>
          <p className="text-xs font-semibold">{t("owned")}</p>
          <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
            {t("duplicates", { count: entry.duplicateQuantity })}
          </p>
        </div>
        <QuantityButtons
          value={entry.ownedQuantity}
          pending={pending}
          minusDisabled={entry.ownedQuantity === 0}
          plusDisabled={false}
          minusLabel={t("remove", { name: cardName })}
          plusLabel={t("add", { name: cardName })}
          onMinus={() => adjustOwned(-1)}
          onPlus={() => adjustOwned(1)}
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border bg-background/65 p-3">
        <div>
          <p className="text-xs font-semibold">{t("trade")}</p>
          <p className="mt-0.5 text-[0.68rem] text-muted-foreground">{t("tradeLimit")}</p>
        </div>
        <QuantityButtons
          value={entry.tradeQuantity}
          pending={pending}
          minusDisabled={entry.tradeQuantity === 0}
          plusDisabled={entry.tradeQuantity >= entry.duplicateQuantity}
          minusLabel={t("removeTrade", { name: cardName })}
          plusLabel={t("addTrade", { name: cardName })}
          onMinus={() => adjustTrade(-1)}
          onPlus={() => adjustTrade(1)}
        />
      </div>
      <p className={`min-h-4 text-[0.68rem] ${message === t("saved") ? "text-emerald-600" : "text-destructive"}`} aria-live="polite">
        {message}
      </p>
    </div>
  );
}

function QuantityButtons({
  value,
  pending,
  minusDisabled,
  plusDisabled,
  minusLabel,
  plusLabel,
  onMinus,
  onPlus,
}: {
  value: number;
  pending: boolean;
  minusDisabled: boolean;
  plusDisabled: boolean;
  minusLabel: string;
  plusLabel: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center rounded-lg border bg-card p-1">
      <Button type="button" size="icon-sm" variant="ghost" disabled={pending || minusDisabled} onClick={onMinus} aria-label={minusLabel}>
        <Minus />
      </Button>
      <span className="min-w-10 text-center font-mono text-sm font-semibold tabular-nums">
        {pending ? <LoaderCircle className="mx-auto size-3.5 animate-spin" /> : value}
      </span>
      <Button type="button" size="icon-sm" variant="ghost" disabled={pending || plusDisabled} onClick={onPlus} aria-label={plusLabel}>
        <Plus />
      </Button>
    </div>
  );
}
