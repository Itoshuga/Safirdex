"use client";

import { Library, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { collectionEntryState } from "@/features/collection/domain";
import {
  setOwnedQuantityAction,
  setTradeQuantityAction,
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
  compactVariant?: "bar" | "floating" | "inline" | "catalogue";
  detailLayout?: boolean;
  onChange?: (entry: CollectionEntryState) => void;
}) {
  const t = useTranslations("Collection.quantity");
  const [entry, setEntry] = useState(initialEntry);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const desiredEntry = useRef(initialEntry);
  const persistedEntry = useRef(initialEntry);
  const synchronizing = useRef(false);

  function commit(next: CollectionEntryState) {
    desiredEntry.current = next;
    setEntry(next);
    onChange?.(next);
  }

  function isSameEntry(left: CollectionEntryState, right: CollectionEntryState) {
    return left.ownedQuantity === right.ownedQuantity &&
      left.tradeQuantity === right.tradeQuantity;
  }

  async function synchronize() {
    if (synchronizing.current) return;
    synchronizing.current = true;
    setPending(true);

    try {
      while (!isSameEntry(desiredEntry.current, persistedEntry.current)) {
        const desired = desiredEntry.current;
        const persisted = persistedEntry.current;
        const result = desired.ownedQuantity !== persisted.ownedQuantity
          ? await setOwnedQuantityAction({
              cardId,
              quantity: desired.ownedQuantity,
            })
          : await setTradeQuantityAction({
              cardId,
              quantity: desired.tradeQuantity,
            });

        if (!result.ok) {
          commit(persistedEntry.current);
          setMessage(result.code === "TRADE_EXCEEDS_DUPLICATES" ? t("tradeLimit") : t("error"));
          return;
        }

        persistedEntry.current = result.entry;
        if (isSameEntry(desiredEntry.current, result.entry)) {
          commit(result.entry);
        }
      }

      setMessage(t("saved"));
    } finally {
      synchronizing.current = false;
      setPending(false);
    }
  }

  function adjustOwned(delta: -1 | 1) {
    const current = desiredEntry.current;
    if (delta < 0 && current.ownedQuantity === 0) return;
    const next = collectionEntryState(
      cardId,
      current.ownedQuantity + delta,
      current.tradeQuantity,
    );
    if (isSameEntry(current, next)) return;
    commit(next);
    setMessage("");
    void synchronize();
  }

  function adjustTrade(delta: -1 | 1) {
    const current = desiredEntry.current;
    if (
      (delta < 0 && current.tradeQuantity === 0) ||
      (delta > 0 && current.tradeQuantity >= current.duplicateQuantity)
    ) return;
    const next = collectionEntryState(
      cardId,
      current.ownedQuantity,
      current.tradeQuantity + delta,
    );
    commit(next);
    setMessage("");
    void synchronize();
  }

  if (compact) {
    if (compactVariant === "catalogue") {
      return entry.ownedQuantity > 0 ? (
        <div className="flex min-h-11 items-center justify-between gap-2 border-t bg-muted/15 px-2.5 py-1.5 sm:px-3" aria-busy={pending}>
          <span className="flex min-w-0 items-center gap-1.5 truncate text-[0.68rem] font-semibold text-muted-foreground">
            <Library className="size-3.5 shrink-0 text-safir" aria-hidden="true" />
            {t("ownedCompact", { count: entry.ownedQuantity })}
          </span>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="rounded-full"
              onClick={() => adjustOwned(-1)}
              aria-label={t("remove", { name: cardName })}
            >
              <Minus />
            </Button>
            <span className="grid min-w-6 place-items-center font-mono text-xs font-semibold tabular-nums">
              {entry.ownedQuantity}
            </span>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="rounded-full"
              onClick={() => adjustOwned(1)}
              aria-label={t("add", { name: cardName })}
            >
              <Plus />
            </Button>
          </div>
          <span className="sr-only" aria-live="polite">{message}</span>
        </div>
      ) : (
        <div className="border-t bg-muted/10 p-1.5" aria-busy={pending}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-full rounded-lg text-xs text-safir hover:bg-safir/10 hover:text-safir"
            onClick={() => adjustOwned(1)}
            aria-label={t("add", { name: cardName })}
          >
            <Plus />
            {t("addShort")}
          </Button>
          <span className="sr-only" aria-live="polite">{message}</span>
        </div>
      );
    }

    if (compactVariant === "floating") {
      return (
        <div className="inline-flex items-center rounded-full border border-white/20 bg-background/88 p-1 shadow-lg shadow-black/15 backdrop-blur-xl" aria-busy={pending}>
          {entry.ownedQuantity > 0 ? (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              className="rounded-full"
              onClick={() => adjustOwned(-1)}
              aria-label={t("remove", { name: cardName })}
            >
              <Minus />
            </Button>
          ) : null}
          {entry.ownedQuantity > 0 ? (
            <span className="min-w-7 text-center font-mono text-xs font-semibold tabular-nums">
              {entry.ownedQuantity}
            </span>
          ) : null}
          <Button
            type="button"
            size={entry.ownedQuantity > 0 ? "icon-xs" : "sm"}
            variant={entry.ownedQuantity > 0 ? "ghost" : "default"}
            className="rounded-full"
            onClick={() => adjustOwned(1)}
            aria-label={t("add", { name: cardName })}
          >
            <Plus />
            {entry.ownedQuantity === 0 ? <span>{t("quickAddShort")}</span> : null}
          </Button>
          <span className="sr-only" aria-live="polite">{message}</span>
        </div>
      );
    }

    return (
      <div className={`flex min-h-11 items-center justify-between gap-2 px-3 py-2 ${compactVariant === "bar" ? "border-t bg-muted/20" : "sm:h-full sm:flex-col sm:justify-center sm:px-3"}`} aria-busy={pending}>
        <span className="min-w-0 truncate text-[0.68rem] font-semibold text-muted-foreground">
          {entry.ownedQuantity > 0 ? `${t("owned")} · ${entry.ownedQuantity}` : t("quickAdd")}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {entry.ownedQuantity > 0 ? (
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={() => adjustOwned(-1)}
              aria-label={t("remove", { name: cardName })}
            >
              <Minus />
            </Button>
          ) : null}
          <span className="min-w-5 text-center font-mono text-xs font-semibold tabular-nums">
            {entry.ownedQuantity}
          </span>
          <Button
            type="button"
            size="icon-xs"
            variant={entry.ownedQuantity > 0 ? "ghost" : "default"}
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
      <div aria-busy={pending}>
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
    <div className="space-y-3" aria-busy={pending}>
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
    <div className="flex items-center rounded-lg border bg-card p-1" aria-busy={pending}>
      <Button type="button" size="icon-sm" variant="ghost" disabled={minusDisabled} onClick={onMinus} aria-label={minusLabel}>
        <Minus />
      </Button>
      <span className="min-w-10 text-center font-mono text-sm font-semibold tabular-nums">
        {value}
      </span>
      <Button type="button" size="icon-sm" variant="ghost" disabled={plusDisabled} onClick={onPlus} aria-label={plusLabel}>
        <Plus />
      </Button>
    </div>
  );
}
