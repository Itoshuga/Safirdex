"use client";

import {
  Check,
  Command,
  Crown,
  Layers3,
  Search,
  Ticket,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { getLocalizedValue } from "@/lib/i18n/get-localized-value";
import type { AppLocale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";
import type { CardPreviewData } from "@/types/card-preview";

type QuickFilter = "all" | "commander" | "promo" | null;

export interface CodexSearchCopy {
  placeholder: string;
  searchLabel: string;
  allCards: string;
  commanders: string;
  promos: string;
  results: string;
  noResults: string;
  clear: string;
  stats: { attack: string; value: string; defense: string };
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function CodexSearch({
  cards,
  locale,
  copy,
}: {
  cards: CardPreviewData[];
  locale: AppLocale;
  copy: CodexSearchCopy;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuickFilter>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    const handleOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

  const results = useMemo(() => {
    const normalizedQuery = normalize(query);
    return cards.filter((card) => {
      if (filter === "commander" && !card.isCommander) return false;
      if (filter === "promo" && !card.isPromo) return false;
      if (!normalizedQuery) return true;
      const translation = getLocalizedValue(card.translations, locale);
      const searchable = normalize(
        [
          translation?.name,
          translation?.description,
          card.number,
          card.attack,
          card.value,
          card.defense,
        ]
          .filter((value) => value !== undefined)
          .join(" "),
      );
      return searchable.includes(normalizedQuery);
    });
  }, [cards, filter, locale, query]);

  function selectFilter(nextFilter: Exclude<QuickFilter, null>) {
    setFilter((current) => (current === nextFilter ? null : nextFilter));
    setOpen(true);
    inputRef.current?.focus();
  }

  function clearSearch() {
    setQuery("");
    setFilter(null);
    inputRef.current?.focus();
  }

  const quickLinks = [
    { id: "all" as const, label: copy.allCards, icon: Layers3 },
    { id: "commander" as const, label: copy.commanders, icon: Crown },
    { id: "promo" as const, label: copy.promos, icon: Ticket },
  ];

  return (
    <div ref={rootRef} className="relative mx-auto mt-10 w-full max-w-3xl sm:mt-12">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        <label className="sr-only" htmlFor="codex-search">
          {copy.searchLabel}
        </label>
        <div
          className={cn(
            "relative flex h-16 items-center rounded-xl border border-foreground/14 bg-card/95 px-4 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl transition duration-200 sm:h-[4.5rem] sm:px-5",
            open && "border-safir/55 ring-4 ring-safir/10",
          )}
        >
          <Search className="size-5 shrink-0 text-muted-foreground sm:size-[1.35rem]" aria-hidden="true" />
          <input
            ref={inputRef}
            id="codex-search"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-[1rem] outline-none placeholder:text-muted-foreground/65 [&::-webkit-search-cancel-button]:hidden sm:px-4 sm:text-[1.05rem]"
            type="search"
            autoComplete="off"
            value={query}
            placeholder={copy.placeholder}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
          />
          {query || filter ? (
            <button
              type="button"
              onClick={clearSearch}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={copy.clear}
            >
              <X className="size-4" />
            </button>
          ) : (
            <span className="hidden items-center gap-1 rounded-lg border bg-muted/45 px-2 py-1 font-mono text-[0.68rem] text-muted-foreground sm:flex">
              <Command className="size-3" /> K
            </span>
          )}
        </div>
      </form>

      <nav className="mt-5 grid overflow-hidden rounded-xl border border-border/80 bg-card/55 text-left sm:grid-cols-3" aria-label="Quick access">
        {quickLinks.map(({ id, label, icon: Icon }, index) => {
          const active = filter === id;
          return (
            <button
              type="button"
              key={id}
              onClick={() => selectFilter(id)}
              aria-pressed={active}
              className={cn(
                "group flex min-h-14 items-center gap-3 border-b px-4 text-xs font-medium text-muted-foreground transition last:border-b-0 hover:bg-muted/65 hover:text-foreground sm:border-r sm:border-b-0 sm:last:border-r-0",
                active && "bg-safir/[0.07] text-safir",
              )}
            >
              <span className="font-mono text-[0.62rem] text-muted-foreground/55">0{index + 1}</span>
              {active ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {open ? (
        <section className="absolute inset-x-0 top-full z-30 mt-3 overflow-hidden rounded-xl border border-foreground/12 bg-card/98 text-left shadow-[0_28px_80px_-30px_rgba(10,20,30,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
            <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {copy.results}
            </p>
            <span className="text-xs tabular-nums text-muted-foreground">
              {results.length}
            </span>
          </div>
          <div className="max-h-[min(24rem,55svh)] overflow-y-auto p-1.5">
            {results.length ? (
              results.map((card) => {
                const translation = getLocalizedValue(card.translations, locale);
                const rarity = getLocalizedValue(card.rarity, locale) ?? "";
                const types = getLocalizedValue(card.types, locale) ?? [];
                return (
                  <article
                    key={card.id}
                    className="group flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-muted/65 sm:px-4"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border bg-background font-mono text-[0.65rem] font-semibold text-safir">
                      {String(card.number).padStart(3, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {translation?.name ?? `#${card.number}`}
                        </p>
                        {card.isCommander ? <Badge className="hidden sm:inline-flex" variant="secondary">CMD</Badge> : null}
                        {card.isPromo ? <Badge className="hidden sm:inline-flex" variant="outline">Promo</Badge> : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        #{String(card.number).padStart(3, "0")} · {[rarity, ...types].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <dl className="hidden shrink-0 grid-cols-3 gap-1.5 sm:grid">
                      {[
                        [copy.stats.attack, card.attack],
                        [copy.stats.value, card.value],
                        [copy.stats.defense, card.defense],
                      ].map(([label, value]) => (
                        <div className="min-w-9 rounded-lg bg-muted/60 px-2 py-1 text-center" key={label} title={String(label)}>
                          <dt className="text-[0.55rem] font-semibold text-muted-foreground uppercase">{String(label).slice(0, 1)}</dt>
                          <dd className="text-xs font-semibold tabular-nums">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                );
              })
            ) : (
              <div className="grid min-h-40 place-items-center px-6 text-center">
                <div>
                  <Search className="mx-auto mb-3 size-5 text-muted-foreground/55" />
                  <p className="text-sm text-muted-foreground">{copy.noResults}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
