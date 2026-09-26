"use client";

import {
  BookOpen,
  Command,
  Layers3,
  Search,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { HomeCardSearchItem } from "@/features/cards/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function CodexSearch({
  cards,
}: {
  cards: HomeCardSearchItem[];
}) {
  const t = useTranslations("Home.search");
  const stats = useTranslations("Cards.stats");
  const labels = useTranslations("Cards.labels");
  const nav = useTranslations("Navigation");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
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
      if (!normalizedQuery) return true;
      const searchable = normalize(
        [
          card.name,
          card.description,
          card.number,
          card.attack,
          card.value,
          card.defense,
          card.rarityName,
          ...card.typeNames,
        ]
          .filter((value) => value !== undefined)
          .join(" "),
      );
      return searchable.includes(normalizedQuery);
    });
  }, [cards, query]);

  function clearSearch() {
    setQuery("");
    inputRef.current?.focus();
  }

  const quickLinks = [
    { id: "cards", label: t("cards"), icon: BookOpen, href: "/cards" as const },
    { id: "decks", label: t("decks"), icon: Layers3, href: "/decks" as const },
    { id: "community", label: t("community"), icon: Users, href: "/community" as const },
  ];

  return (
    <div ref={rootRef} className="relative mx-auto mt-10 w-full max-w-3xl sm:mt-12">
      <form
        className="relative z-40"
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        <label className="sr-only" htmlFor="codex-search">
          {t("label")}
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
            placeholder={t("placeholder")}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
          />
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={t("clear")}
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

      <nav className="mt-5 grid overflow-hidden rounded-xl border border-border/80 bg-card/55 text-left sm:grid-cols-3" aria-label={nav("quickAccess")}>
        {quickLinks.map(({ id, label, icon: Icon, ...item }, index) => {
          const content = (
            <>
              <span className="font-mono text-[0.62rem] text-muted-foreground/55">0{index + 1}</span>
              <Icon className="size-3.5" />
              <span>{label}</span>
            </>
          );
          const className = "flex min-h-14 items-center gap-3 border-b px-4 text-xs font-medium text-muted-foreground transition last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0";
          const href = "href" in item ? item.href : undefined;
          return href ? (
            <Link key={id} href={href} className={`${className} hover:bg-muted/55 hover:text-foreground`}>
              {content}
            </Link>
          ) : (
            <span key={id} aria-disabled="true" className={`${className} cursor-default`}>
              {content}
            </span>
          );
        })}
      </nav>

      {open ? (
        <section className="absolute inset-x-0 top-16 z-50 mt-3 overflow-hidden rounded-xl border border-foreground/12 bg-card/98 text-left shadow-[0_28px_80px_-30px_rgba(10,20,30,0.45)] backdrop-blur-xl sm:top-[4.5rem]">
          <div className="flex items-center justify-between border-b px-4 py-3 sm:px-5">
            <p className="text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              {t("results")}
            </p>
            <span className="text-xs tabular-nums text-muted-foreground">
              {results.length}
            </span>
          </div>
          <div className="max-h-[min(24rem,55svh)] overflow-y-auto p-1.5">
            {results.length ? (
              results.map((card) => {
                return (
                  <Link
                    key={card.id}
                    href={`/cards/${card.slug}`}
                    prefetch={false}
                    className="group flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-muted/65 sm:px-4"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border bg-background font-mono text-[0.65rem] font-semibold text-safir">
                      {String(card.number).padStart(3, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {card.name}
                        </p>
                        {card.isCommander ? <Badge className="hidden sm:inline-flex" variant="secondary">{labels("commander")}</Badge> : null}
                        {card.isPromo ? <Badge className="hidden sm:inline-flex" variant="outline">{labels("promo")}</Badge> : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        #{String(card.number).padStart(3, "0")} · {[card.rarityName, ...card.typeNames].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <dl className="hidden shrink-0 grid-cols-3 gap-1.5 sm:grid">
                      {[
                        [stats("attack"), card.attack],
                        [stats("value"), card.value],
                        [stats("defense"), card.defense],
                      ].map(([label, value]) => (
                        <div className="min-w-9 rounded-lg bg-muted/60 px-2 py-1 text-center" key={label} title={String(label)}>
                          <dt className="text-[0.55rem] font-semibold text-muted-foreground uppercase">{String(label).slice(0, 1)}</dt>
                          <dd className="text-xs font-semibold tabular-nums">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </Link>
                );
              })
            ) : (
              <div className="grid min-h-40 place-items-center px-6 text-center">
                <div>
                  <Search className="mx-auto mb-3 size-5 text-muted-foreground/55" />
                  <p className="text-sm text-muted-foreground">{t("noResults")}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
