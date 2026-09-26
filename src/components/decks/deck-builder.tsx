"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  Globe2,
  Layers3,
  LockKeyhole,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  loadDeckCardsAction,
  loadDeckCommandersAction,
  saveDeckAction,
} from "@/app/[locale]/decks/actions";
import { DeckBuilderCard } from "@/components/decks/deck-builder-card";
import { DeckFiltersSheet, EMPTY_DECK_FILTERS } from "@/components/decks/deck-filters-sheet";
import { DeckSidebar } from "@/components/decks/deck-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CodexFilterOptions } from "@/features/cards/types";
import { INITIAL_DECK_ACTION_STATE } from "@/features/decks/action-state";
import { SAFIR_STANDARD_RULESET } from "@/features/decks/rules/ruleset";
import {
  isCombatantCompatibleWithCommander,
  validateDeck,
} from "@/features/decks/rules/validate-deck";
import type {
  DeckBuilderDraft,
  DeckCatalogCard,
  DeckCatalogFilters,
  DeckCatalogQuery,
  DeckRuleIssue,
} from "@/features/decks/types";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface FactionOption {
  id: string;
  label: string;
  color?: string;
}

const STEPS = ["information", "commander", "build"] as const;
const VISIBILITIES = ["private", "unlisted", "public"] as const;

function uniqueCards(cards: DeckCatalogCard[]) {
  return [...new Map(cards.map((card) => [card.id, card])).values()];
}

function newFilters(): DeckCatalogFilters {
  return {
    ...EMPTY_DECK_FILTERS,
    factionIds: [],
    typeIds: [],
    rarityIds: [],
  };
}

function ProgressMetric({
  label,
  current,
  target,
  complete,
  compact = false,
}: {
  label: string;
  current: number;
  target: number;
  complete: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("min-w-32", compact && "min-w-0 flex-1")}>
      <div className="flex items-center justify-between gap-3 text-[0.65rem]"><span className="text-muted-foreground">{label}</span><strong className="tabular-nums">{current}/{target}{complete ? " ✓" : ""}</strong></div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full transition-[width]", complete ? "bg-emerald-500" : "bg-safir")} style={{ width: `${Math.min(100, (current / target) * 100)}%` }} /></div>
    </div>
  );
}

export function DeckBuilder({
  locale,
  initialDraft,
  initialCatalogCards,
  initialCommanderCards,
  initialSelectedCards = [],
  initialNextCursor,
  initialCommanderNextCursor,
  factions,
  filterOptions,
}: {
  locale: string;
  initialDraft: DeckBuilderDraft;
  initialCatalogCards: DeckCatalogCard[];
  initialCommanderCards: DeckCatalogCard[];
  initialSelectedCards?: DeckCatalogCard[];
  initialNextCursor?: string;
  initialCommanderNextCursor?: string;
  factions: FactionOption[];
  filterOptions: CodexFilterOptions;
}) {
  const t = useTranslations("Decks.builder");
  const rules = useTranslations("Decks.rules");
  const status = useTranslations("Decks.status");
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveDeckAction, INITIAL_DECK_ACTION_STATE);
  const [draft, setDraft] = useState(initialDraft);
  const [step, setStep] = useState(initialDraft.deckId ? 2 : 0);
  const [commanderChoice, setCommanderChoice] = useState<"with" | "without" | null>(initialDraft.commanderId ? "with" : initialDraft.deckId ? "without" : null);
  const [knownCards, setKnownCards] = useState(() => uniqueCards([...initialSelectedCards, ...initialCatalogCards, ...initialCommanderCards]));
  const [catalogCards, setCatalogCards] = useState(initialCatalogCards);
  const [commanderCards, setCommanderCards] = useState(initialCommanderCards);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [commanderNextCursor, setCommanderNextCursor] = useState(initialCommanderNextCursor);
  const [filters, setFilters] = useState<DeckCatalogFilters>(newFilters);
  const [commanderSearch, setCommanderSearch] = useState("");
  const [commanderFaction, setCommanderFaction] = useState("");
  const [mobilePane, setMobilePane] = useState<"browse" | "deck">("browse");
  const [dirty, setDirty] = useState(false);
  const [submittedIntent, setSubmittedIntent] = useState<"draft" | "publish">("draft");
  const [loadingCatalog, startCatalogTransition] = useTransition();
  const [loadingMore, startLoadingMore] = useTransition();
  const firstCatalogRequest = useRef(true);
  const catalogRequestId = useRef(0);
  useUnsavedChanges(dirty && !pending);

  useEffect(() => {
    if (state.status !== "success" || !state.deckId) return;
    if (submittedIntent === "publish") {
      router.push(`/decks/${state.deckId}`);
      router.refresh();
      return;
    }
    const cleanStateTimer = window.setTimeout(() => setDirty(false), 0);
    if (!draft.deckId) {
      router.replace(`/decks/${state.deckId}/edit`);
    } else {
      router.refresh();
    }
    return () => window.clearTimeout(cleanStateTimer);
  }, [draft.deckId, router, state, submittedIntent]);

  const serverQuery = useMemo<DeckCatalogQuery>(() => ({
    ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.factionIds.length ? { factionIds: filters.factionIds } : {}),
    ...(filters.typeIds.length ? { typeIds: filters.typeIds } : {}),
    ...(filters.rarityIds.length ? { rarityIds: filters.rarityIds } : {}),
    ...(filters.seasonId ? { seasonId: filters.seasonId } : {}),
    ...(filters.setId ? { setId: filters.setId } : {}),
    ...(filters.attackMin > 0 ? { attackMin: filters.attackMin } : {}),
    ...(filters.attackMax < 9 ? { attackMax: filters.attackMax } : {}),
    ...(filters.valueMin > 0 ? { valueMin: filters.valueMin } : {}),
    ...(filters.valueMax < 9 ? { valueMax: filters.valueMax } : {}),
    ...(filters.defenseMin > 0 ? { defenseMin: filters.defenseMin } : {}),
    ...(filters.defenseMax < 9 ? { defenseMax: filters.defenseMax } : {}),
    ...(filters.sort !== "number" ? { sort: filters.sort } : {}),
  }), [filters]);
  const serverQueryKey = JSON.stringify(serverQuery);

  useEffect(() => {
    if (firstCatalogRequest.current) {
      firstCatalogRequest.current = false;
      return;
    }
    const requestId = ++catalogRequestId.current;
    const timeout = window.setTimeout(() => {
      const query = JSON.parse(serverQueryKey) as DeckCatalogQuery;
      startCatalogTransition(async () => {
        const page = await loadDeckCardsAction(locale, query);
        if (requestId !== catalogRequestId.current) return;
        setCatalogCards(page.items);
        setKnownCards((current) => uniqueCards([...current, ...page.items]));
        setNextCursor(page.nextCursor);
      });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [locale, serverQueryKey]);

  const byId = useMemo(() => new Map(knownCards.map((card) => [card.id, card])), [knownCards]);
  const entries = useMemo(
    () => draft.entries.flatMap((entry) => {
      const card = byId.get(entry.cardId);
      return card ? [{ ...entry, card }] : [];
    }),
    [byId, draft.entries],
  );
  const commander = draft.commanderId ? byId.get(draft.commanderId) ?? null : null;
  const result = useMemo(() => validateDeck({ entries, commander }), [commander, entries]);
  const factionById = useMemo(() => new Map(factions.map((item) => [item.id, item])), [factions]);
  const visibleCommanders = commanderCards.filter((card) =>
    (!commanderSearch.trim() || card.name.toLocaleLowerCase(locale).includes(commanderSearch.trim().toLocaleLowerCase(locale))) &&
    (!commanderFaction || card.factionIds.includes(commanderFaction)),
  );

  function quantity(cardId: string) {
    return draft.entries.find((entry) => entry.cardId === cardId)?.quantity ?? 0;
  }

  const visibleCatalogCards = useMemo(() => {
    const values = catalogCards.filter((card) => {
      const count = draft.entries.find((entry) => entry.cardId === card.id)?.quantity ?? 0;
      const compatible = Boolean(commander && card.gameplayKind === "combatant" && isCombatantCompatibleWithCommander(card.factionIds, commander.factionIds));
      if (filters.compatibleOnly && !compatible) return false;
      if (filters.membership === "in" && count === 0) return false;
      if (filters.membership === "out" && count > 0) return false;
      return true;
    });
    return [...values].sort((left, right) => {
      if (filters.sort === "name") return left.name.localeCompare(right.name, locale);
      if (filters.sort === "attack") return (right.attack ?? 0) - (left.attack ?? 0) || left.number - right.number;
      if (filters.sort === "value") return right.value - left.value || left.number - right.number;
      if (filters.sort === "defense") return (right.defense ?? 0) - (left.defense ?? 0) || left.number - right.number;
      return left.number - right.number;
    });
  }, [catalogCards, commander, draft.entries, filters.compatibleOnly, filters.membership, filters.sort, locale]);

  function updateDraft(patch: Partial<DeckBuilderDraft>) {
    setDirty(true);
    setDraft((current) => ({ ...current, ...patch }));
  }

  function changeQuantity(cardId: string, delta: number) {
    const card = byId.get(cardId);
    if (!card) return;
    const current = quantity(cardId);
    const copiesForGameplay = entries.filter((entry) => entry.card.gameplayCardId === card.gameplayCardId).reduce((sum, entry) => sum + entry.quantity, 0);
    if (delta > 0 && (result.cardCount >= SAFIR_STANDARD_RULESET.deckSize.max || copiesForGameplay >= SAFIR_STANDARD_RULESET.maxCopiesPerGameplayCard)) return;
    const next = Math.max(0, Math.min(SAFIR_STANDARD_RULESET.maxCopiesPerGameplayCard, current + delta));
    updateDraft({
      entries: next === 0
        ? draft.entries.filter((entry) => entry.cardId !== cardId)
        : draft.entries.some((entry) => entry.cardId === cardId)
          ? draft.entries.map((entry) => entry.cardId === cardId ? { ...entry, quantity: next } : entry)
          : [...draft.entries, { cardId, quantity: next }],
    });
  }

  function chooseCommander(cardId: string | null) {
    if (draft.commanderId && draft.commanderId !== cardId && !window.confirm(t("changeCommander"))) return;
    updateDraft({ commanderId: cardId });
  }

  function issueText(issue: DeckRuleIssue) {
    if (issue.code === "deck_below_minimum") return rules(issue.code, { count: Math.max(0, (issue.expected ?? SAFIR_STANDARD_RULESET.deckSize.min) - (issue.actual ?? 0)), minimum: issue.expected ?? SAFIR_STANDARD_RULESET.deckSize.min });
    if (issue.code === "deck_above_maximum") return rules(issue.code, { count: Math.max(0, (issue.actual ?? 0) - (issue.expected ?? SAFIR_STANDARD_RULESET.deckSize.max)), maximum: issue.expected ?? SAFIR_STANDARD_RULESET.deckSize.max });
    if (issue.code === "too_many_copies") return rules(issue.code, { maximum: issue.expected ?? SAFIR_STANDARD_RULESET.maxCopiesPerGameplayCard });
    if (issue.code === "not_enough_compatible_combatants") return rules(issue.code, { count: Math.max(0, (issue.expected ?? SAFIR_STANDARD_RULESET.commander.minimumFactionCombatants) - (issue.actual ?? 0)) });
    return rules(issue.code);
  }

  const canContinue = step === 0
    ? draft.name.trim().length >= 2
    : step === 1
      ? commanderChoice === "without" || (commanderChoice === "with" && Boolean(draft.commanderId))
      : true;
  const commanderComplete = !commander || result.compatibleCombatantsCount >= SAFIR_STANDARD_RULESET.commander.minimumFactionCombatants;
  const deckTarget = result.cardCount < SAFIR_STANDARD_RULESET.deckSize.min ? SAFIR_STANDARD_RULESET.deckSize.min : SAFIR_STANDARD_RULESET.deckSize.max;

  const activeFilters = [
    ...filters.factionIds.map((id) => ({ key: `faction-${id}`, label: factionById.get(id)?.label ?? id, remove: () => setFilters((current) => ({ ...current, factionIds: current.factionIds.filter((item) => item !== id) })) })),
    ...filters.typeIds.map((id) => ({ key: `type-${id}`, label: filterOptions.types.find((item) => item.id === id)?.name ?? id, remove: () => setFilters((current) => ({ ...current, typeIds: current.typeIds.filter((item) => item !== id) })) })),
    ...filters.rarityIds.map((id) => ({ key: `rarity-${id}`, label: filterOptions.rarities.find((item) => item.id === id)?.name ?? id, remove: () => setFilters((current) => ({ ...current, rarityIds: current.rarityIds.filter((item) => item !== id) })) })),
    ...(filters.seasonId ? [{ key: `season-${filters.seasonId}`, label: filterOptions.seasons.find((item) => item.id === filters.seasonId)?.name ?? filters.seasonId, remove: () => setFilters((current) => ({ ...current, seasonId: "", setId: "" })) }] : []),
    ...(filters.setId ? [{ key: `set-${filters.setId}`, label: filterOptions.sets.find((item) => item.id === filters.setId)?.name ?? filters.setId, remove: () => setFilters((current) => ({ ...current, setId: "" })) }] : []),
    ...(filters.attackMin > 0 || filters.attackMax < 9 ? [{ key: "attack-range", label: `ATK ${filters.attackMin}–${filters.attackMax}`, remove: () => setFilters((current) => ({ ...current, attackMin: 0, attackMax: 9 })) }] : []),
    ...(filters.valueMin > 0 || filters.valueMax < 9 ? [{ key: "value-range", label: `VAL ${filters.valueMin}–${filters.valueMax}`, remove: () => setFilters((current) => ({ ...current, valueMin: 0, valueMax: 9 })) }] : []),
    ...(filters.defenseMin > 0 || filters.defenseMax < 9 ? [{ key: "defense-range", label: `DEF ${filters.defenseMin}–${filters.defenseMax}`, remove: () => setFilters((current) => ({ ...current, defenseMin: 0, defenseMax: 9 })) }] : []),
  ];

  const sidebar = (
    <DeckSidebar
      commander={commander}
      entries={entries}
      result={result}
      pending={pending}
      dirty={dirty}
      issueText={issueText}
      onChangeCommander={() => { setCommanderChoice("with"); setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
      onAdd={(cardId) => changeQuantity(cardId, 1)}
      onRemove={(cardId) => changeQuantity(cardId, -1)}
      onIntent={setSubmittedIntent}
    />
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="payload" value={JSON.stringify(draft)} />

      {step < 2 ? (
        <div className="mx-auto max-w-6xl overflow-clip rounded-2xl border bg-card">
          <ol className="grid grid-cols-3 gap-1 border-b bg-muted/30 p-3 sm:p-4" aria-label={t("progressLabel")}>
            {STEPS.map((item, index) => (
              <li key={item}>
                <button type="button" onClick={() => index <= step && setStep(index)} disabled={index > step} aria-current={index === step ? "step" : undefined} className={cn("flex h-10 w-full items-center justify-center gap-2 rounded-xl px-2 text-xs font-medium", index === step ? "bg-card shadow-sm" : index < step ? "text-safir" : "text-muted-foreground")}>
                  <span className={cn("grid size-5 place-items-center rounded-full text-[0.62rem]", index <= step ? "bg-safir text-safir-foreground" : "bg-muted")}>{index < step ? <Check className="size-3" /> : index + 1}</span>
                  <span className="hidden sm:inline">{t(`steps.${item}`)}</span>
                </button>
              </li>
            ))}
          </ol>

          {state.status === "error" ? <div role="alert" className="m-5 flex gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="size-4 shrink-0" />{state.message && ["AUTH_REQUIRED", "PROFILE_REQUIRED", "DECK_NOT_LEGAL", "CARD_NOT_FOUND", "FORBIDDEN", "DECK_SAVE_FAILED"].includes(state.message) ? t(`errors.${state.message}` as "errors.AUTH_REQUIRED") : t("errors.fallback")}</div> : null}

          {step === 0 ? (
            <section className="mx-auto max-w-2xl px-5 py-9 sm:px-8 sm:py-12">
              <p className="eyebrow">{t("steps.information")}</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em]">{t("deckStepTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("deckStepDescription")}</p>
              <div className="mt-8 space-y-6">
                <div className="space-y-2"><label className="admin-label" htmlFor="deck-name">{t("name")}</label><input id="deck-name" className="admin-input h-11 rounded-xl px-4" maxLength={80} value={draft.name} placeholder={t("namePlaceholder")} onChange={(event) => updateDraft({ name: event.target.value })} /></div>
                <div className="space-y-2"><div className="flex justify-between gap-3"><label className="admin-label" htmlFor="deck-description">{t("descriptionOptional")}</label><span className="text-xs tabular-nums text-muted-foreground">{draft.description.length}/2000</span></div><textarea id="deck-description" className="admin-textarea min-h-32 rounded-xl px-4 py-3" maxLength={2000} value={draft.description} placeholder={t("descriptionPlaceholder")} onChange={(event) => updateDraft({ description: event.target.value })} /></div>
                <fieldset className="space-y-3"><legend className="admin-label">{t("visibility")}</legend><div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">{VISIBILITIES.map((value) => { const Icon = value === "private" ? LockKeyhole : value === "unlisted" ? Eye : Globe2; return <button key={value} type="button" aria-pressed={draft.visibility === value} onClick={() => updateDraft({ visibility: value })} className={cn("flex h-11 items-center justify-center gap-2 rounded-lg px-2 text-xs font-medium", draft.visibility === value ? "bg-card shadow-sm" : "text-muted-foreground")}><Icon className="size-3.5" /><span className="hidden sm:inline">{status(value)}</span></button>; })}</div><p className="text-xs text-muted-foreground">{t(`visibilityHelp.${draft.visibility}`)}</p></fieldset>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="px-5 py-9 sm:px-8 sm:py-12">
              <div className="mx-auto max-w-5xl">
                <div className="max-w-2xl"><p className="eyebrow">{t("steps.commander")}</p><h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em]">{t("commanderQuestion")}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{t("commanderChoiceDescription")}</p></div>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  <button type="button" onClick={() => setCommanderChoice("with")} className={cn("flex min-h-32 items-start gap-4 rounded-2xl border p-5 text-left transition hover:border-safir/40", commanderChoice === "with" && "border-safir bg-safir/5 ring-2 ring-safir/10")}><span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", commanderChoice === "with" ? "bg-safir text-safir-foreground" : "bg-muted text-muted-foreground")}><Crown className="size-5" /></span><span><strong className="block font-heading text-lg">{t("withCommander")}</strong><span className="mt-2 block text-sm leading-5 text-muted-foreground">{t("withCommanderDescription")}</span></span></button>
                  <button type="button" onClick={() => { setCommanderChoice("without"); chooseCommander(null); }} className={cn("flex min-h-32 items-start gap-4 rounded-2xl border p-5 text-left transition hover:border-safir/40", commanderChoice === "without" && "border-safir bg-safir/5 ring-2 ring-safir/10")}><span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", commanderChoice === "without" ? "bg-safir text-safir-foreground" : "bg-muted text-muted-foreground")}><Layers3 className="size-5" /></span><span><strong className="block font-heading text-lg">{t("withoutCommander")}</strong><span className="mt-2 block text-sm leading-5 text-muted-foreground">{t("withoutCommanderDescription")}</span></span></button>
                </div>

                {commanderChoice === "with" ? (
                  <div className="mt-9">
                    <div className="grid gap-2 rounded-xl border bg-muted/25 p-2 sm:grid-cols-[minmax(0,1fr)_14rem]"><label className="relative"><Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" /><input aria-label={t("searchCommanders")} className="admin-input border-transparent bg-card pl-9" value={commanderSearch} placeholder={t("searchCommanders")} onChange={(event) => setCommanderSearch(event.target.value)} /></label><select aria-label={t("allFactions")} className="admin-input border-transparent bg-card" value={commanderFaction} onChange={(event) => setCommanderFaction(event.target.value)}><option value="">{t("allFactions")}</option>{factions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
                    <p className="mt-4 text-xs text-muted-foreground">{t("commanderResults", { count: visibleCommanders.length })}</p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleCommanders.map((card) => { const selected = draft.commanderId === card.id; return <button key={card.id} type="button" onClick={() => chooseCommander(card.id)} className={cn("group overflow-hidden rounded-2xl border bg-card text-left transition hover:border-safir/40", selected && "border-safir ring-2 ring-safir/10")}><span className="relative block aspect-[16/9] overflow-hidden bg-muted">{card.artwork.url ? <Image src={card.artwork.url} alt={card.name} fill className="object-cover transition duration-200 group-hover:scale-[1.015]" sizes="(min-width: 1024px) 30vw, 50vw" /> : null}{selected ? <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-safir px-2.5 py-1.5 text-xs font-semibold text-safir-foreground"><Check className="size-3.5" /> {t("selected")}</span> : null}</span><span className="block p-4"><strong className="font-heading text-lg">{card.name}</strong><span className="mt-2 flex flex-wrap gap-1.5">{card.factionIds.map((id) => <Badge key={id} variant="secondary">{factionById.get(id)?.label ?? id}</Badge>)}</span></span></button>; })}</div>
                    {commanderNextCursor ? <div className="mt-6 flex justify-center"><Button type="button" variant="outline" disabled={loadingMore} onClick={() => startLoadingMore(async () => { const page = await loadDeckCommandersAction(locale, commanderNextCursor); setCommanderCards((current) => uniqueCards([...current, ...page.items])); setKnownCards((current) => uniqueCards([...current, ...page.items])); setCommanderNextCursor(page.nextCursor); })}>{loadingMore ? t("loading") : t("loadMoreCommanders")}</Button></div> : null}
                    {commander ? <div className="mt-6 flex items-start gap-3 rounded-xl border border-safir/20 bg-safir/5 p-4"><Crown className="mt-0.5 size-4 shrink-0 text-safir" /><p className="text-sm leading-6">{t("selectedCommanderRule", { name: commander.name, count: SAFIR_STANDARD_RULESET.commander.minimumFactionCombatants })}</p></div> : null}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          <footer className="flex items-center justify-between border-t bg-card/90 px-4 py-3 backdrop-blur sm:px-6"><Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}><ChevronLeft /> {t("previous")}</Button><Button type="button" className="rounded-xl px-4" disabled={!canContinue} onClick={() => setStep((current) => Math.min(2, current + 1))}>{step === 1 ? t("buildMyDeck") : t("next")} <ChevronRight /></Button></footer>
        </div>
      ) : (
        <div className="pb-20 xl:pb-0">
          <header className="sticky top-0 z-30 rounded-2xl border bg-background/92 p-4 shadow-sm backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/decks" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-4" /> {t("backToDecks")}</Link>
              <div className="min-w-0 flex-1 border-l pl-4"><h2 className="truncate font-heading text-lg font-semibold">{draft.name}</h2><p className="text-[0.65rem] text-muted-foreground">{pending ? t("saving") : dirty ? t("unsavedChanges") : status(result.status)}</p></div>
              <div className="hidden items-center gap-5 lg:flex"><ProgressMetric label={t("deckProgressLabel")} current={result.cardCount} target={deckTarget} complete={result.cardCount >= SAFIR_STANDARD_RULESET.deckSize.min && result.cardCount <= SAFIR_STANDARD_RULESET.deckSize.max} />{commander ? <ProgressMetric label={t("commanderProgressLabel")} current={result.compatibleCombatantsCount} target={SAFIR_STANDARD_RULESET.commander.minimumFactionCombatants} complete={commanderComplete} /> : null}</div>
              <div className="ml-auto flex items-center gap-2"><Button name="intent" value="draft" type="submit" variant="outline" disabled={pending} onClick={() => setSubmittedIntent("draft")}>{t("save")}</Button><Button name="intent" value="publish" type="submit" disabled={pending || !result.isLegal} onClick={() => setSubmittedIntent("publish")}>{result.isLegal ? <Check /> : null}{t("publish")}</Button></div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-3 lg:hidden"><ProgressMetric compact label={t("deckProgressLabel")} current={result.cardCount} target={deckTarget} complete={result.cardCount >= SAFIR_STANDARD_RULESET.deckSize.min && result.cardCount <= SAFIR_STANDARD_RULESET.deckSize.max} />{commander ? <ProgressMetric compact label={t("commanderProgressShort")} current={result.compatibleCombatantsCount} target={SAFIR_STANDARD_RULESET.commander.minimumFactionCombatants} complete={commanderComplete} /> : <div />}</div>
          </header>

          {state.status === "error" ? <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="size-4 shrink-0" />{state.message && ["AUTH_REQUIRED", "PROFILE_REQUIRED", "DECK_NOT_LEGAL", "CARD_NOT_FOUND", "FORBIDDEN", "DECK_SAVE_FAILED"].includes(state.message) ? t(`errors.${state.message}` as "errors.AUTH_REQUIRED") : t("errors.fallback")}</div> : null}

          <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 xl:hidden"><button type="button" className={cn("h-10 rounded-lg text-xs font-medium", mobilePane === "browse" ? "bg-card shadow-sm" : "text-muted-foreground")} onClick={() => setMobilePane("browse")}>{t("cardsTab")}</button><button type="button" className={cn("h-10 rounded-lg text-xs font-medium", mobilePane === "deck" ? "bg-card shadow-sm" : "text-muted-foreground")} onClick={() => setMobilePane("deck")}>{t("myDeckTab", { count: result.cardCount })}</button></div>

          <div className="mt-4 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <section className={cn("min-w-0 rounded-2xl border bg-card p-4 sm:p-5", mobilePane !== "browse" && "hidden xl:block")}>
              <div className="flex flex-col gap-3">
                <label className="relative block"><Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" /><input type="search" className="admin-input h-11 rounded-xl pl-10" value={filters.search} placeholder={t("searchCardsShort")} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} /></label>
                <div className="flex flex-wrap items-center gap-2">
                  <DeckFiltersSheet filters={filters} options={filterOptions} factions={factions} resultCount={visibleCatalogCards.length} onChange={setFilters} onReset={() => setFilters(newFilters())} />
                  <button type="button" onClick={() => setFilters((current) => ({ ...current, compatibleOnly: !current.compatibleOnly }))} disabled={!commander} className={cn("inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition disabled:opacity-40", filters.compatibleOnly ? "border-safir bg-safir/8 text-safir" : "hover:bg-muted")}><Crown className="size-3.5" /> {t("compatibleOnlyShort")}</button>
                  <button type="button" onClick={() => setFilters((current) => ({ ...current, membership: current.membership === "in" ? "all" : "in" }))} className={cn("inline-flex h-10 items-center rounded-xl border px-3 text-xs font-medium transition", filters.membership === "in" ? "border-safir bg-safir/8 text-safir" : "hover:bg-muted")}>{t("inMyDeck")}</button>
                  <button type="button" onClick={() => setFilters((current) => ({ ...current, membership: current.membership === "out" ? "all" : "out" }))} className={cn("inline-flex h-10 items-center rounded-xl border px-3 text-xs font-medium transition", filters.membership === "out" ? "border-safir bg-safir/8 text-safir" : "hover:bg-muted")}>{t("notInMyDeck")}</button>
                  <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground"><span className="hidden sm:inline">{t("sortBy")}</span><select className="h-10 rounded-xl border bg-background px-3 text-xs text-foreground outline-none" value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as DeckCatalogFilters["sort"] }))}><option value="number">{t("sort.number")}</option><option value="name">{t("sort.name")}</option><option value="value">{t("sort.value")}</option><option value="attack">{t("sort.attack")}</option><option value="defense">{t("sort.defense")}</option></select></label>
                </div>
                {activeFilters.length ? <div className="flex flex-wrap items-center gap-2 border-t pt-3">{activeFilters.map((filter) => <button key={filter.key} type="button" onClick={filter.remove} className="inline-flex h-7 items-center gap-1 rounded-full border bg-card px-2.5 text-[0.68rem] font-medium hover:border-safir/40 hover:text-safir">{filter.label} <X className="size-3" /></button>)}<button type="button" className="text-[0.68rem] font-semibold text-muted-foreground hover:text-foreground hover:underline" onClick={() => setFilters(newFilters())}>{t("resetFilters")}</button></div> : null}
              </div>

              <div className="mt-5 flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">{loadingCatalog ? t("searching") : t("resultsOnPage", { count: visibleCatalogCards.length })}</p>{nextCursor ? <span className="text-[0.65rem] text-muted-foreground">{t("moreAvailable")}</span> : null}</div>

              {loadingCatalog ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5" aria-busy="true" aria-label={t("searching")}>{Array.from({ length: 10 }, (_, index) => <div key={index} className="overflow-hidden rounded-2xl border"><div className="aspect-[4/3] animate-pulse bg-muted" /><div className="space-y-3 p-3"><div className="h-3 w-3/4 animate-pulse rounded bg-muted" /><div className="h-9 animate-pulse rounded-lg bg-muted" /></div></div>)}</div> : visibleCatalogCards.length ? <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">{visibleCatalogCards.map((card) => { const count = quantity(card.id); const compatible = Boolean(commander && card.gameplayKind === "combatant" && isCombatantCompatibleWithCommander(card.factionIds, commander.factionIds)); return <DeckBuilderCard key={card.id} card={card} quantity={count} compatible={compatible} canAdd={count < SAFIR_STANDARD_RULESET.maxCopiesPerGameplayCard && result.cardCount < SAFIR_STANDARD_RULESET.deckSize.max} onAdd={() => changeQuantity(card.id, 1)} onRemove={() => changeQuantity(card.id, -1)} />; })}</div> : <div className="mt-4 rounded-2xl border border-dashed px-6 py-16 text-center"><Search className="mx-auto size-8 text-muted-foreground/35" /><h3 className="mt-4 font-heading text-xl font-semibold">{filters.compatibleOnly ? t("noCompatibleResults") : t("noResults")}</h3><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{filters.compatibleOnly ? t("noCompatibleResultsDescription") : t("noResultsDescription")}</p><Button type="button" variant="outline" className="mt-5" onClick={() => setFilters(newFilters())}>{t("resetFilters")}</Button></div>}
              {nextCursor ? <div className="mt-6 flex justify-center"><Button type="button" variant="outline" disabled={loadingMore} onClick={() => startLoadingMore(async () => { const page = await loadDeckCardsAction(locale, serverQuery, nextCursor); setCatalogCards((current) => uniqueCards([...current, ...page.items])); setKnownCards((current) => uniqueCards([...current, ...page.items])); setNextCursor(page.nextCursor); })}>{loadingMore ? t("loading") : t("loadMore")}</Button></div> : null}
            </section>

            <aside className={cn("xl:sticky xl:top-32", mobilePane !== "deck" && "hidden xl:block")}>{sidebar}</aside>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/94 px-4 py-3 backdrop-blur-xl xl:hidden">
            <div className="mx-auto flex max-w-2xl items-center gap-4"><div className="min-w-0 flex-1"><div className="flex items-center justify-between text-xs"><span>{result.cardCount}/{deckTarget} {t("cardsShort")}</span>{commander ? <span><Crown className="mr-1 inline size-3" />{result.compatibleCombatantsCount}/{SAFIR_STANDARD_RULESET.commander.minimumFactionCombatants}</span> : null}</div></div><Button type="button" variant="outline" onClick={() => setMobilePane(mobilePane === "deck" ? "browse" : "deck")}>{mobilePane === "deck" ? t("viewCards") : t("viewMyDeck")}</Button></div>
          </div>
        </div>
      )}
    </form>
  );
}
