"use client";

import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  SearchX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { CardListRow } from "@/components/cards/card-list-row";
import { CardPreview } from "@/components/cards/card-preview";
import { Button } from "@/components/ui/button";
import {
  cardsApiSearchParams,
  cardsHref,
} from "@/features/cards/cards-href";
import type {
  CardListItem,
  CodexQueryState,
} from "@/features/cards/types";
import { emptyCollectionEntry } from "@/features/collection/domain";
import type { CollectionEntryState } from "@/features/collection/types";
import { useCardCatalogueNavigationPreference } from "@/hooks/use-card-catalogue-navigation-preference";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/lib/i18n/locales";

interface CardBatch {
  items: CardListItem[];
  fetchedCount: number;
}

interface CardPageResponse {
  items: CardListItem[];
  nextCursor: string | null;
  page: number;
  pageCount: number;
  fetchedCount: number;
  collectionEntries: CollectionEntryState[] | null;
}

interface CardCatalogueProps {
  locale: AppLocale;
  initialItems: CardListItem[];
  initialCollectionEntries: CollectionEntryState[] | null;
  query: CodexQueryState;
  nextCursor: string | null;
  previousCursor: string | null;
  pageCount: number;
  fetchedCount: number;
}

const emptySubscribe = () => () => undefined;

function uniqueCards(batches: CardBatch[]) {
  const knownIds = new Set<string>();
  return batches.flatMap((batch) =>
    batch.items.filter((card) => {
      if (knownIds.has(card.id)) return false;
      knownIds.add(card.id);
      return true;
    }),
  );
}

export function CardCatalogue({
  locale,
  initialItems,
  initialCollectionEntries,
  query,
  nextCursor: initialNextCursor,
  previousCursor,
  pageCount: initialPageCount,
  fetchedCount,
}: CardCatalogueProps) {
  const results = useTranslations("Cards.results");
  const navigationMode = useCardCatalogueNavigationPreference();
  const [batches, setBatches] = useState<CardBatch[]>([
    { items: initialItems, fetchedCount },
  ]);
  const [collectionEntries, setCollectionEntries] = useState(() =>
    new Map(
      (initialCollectionEntries ?? []).map((entry) => [entry.cardId, entry]),
    ),
  );
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [currentPage, setCurrentPage] = useState(query.page);
  const [pageCount, setPageCount] = useState(initialPageCount);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const supportsAutomaticLoading = useSyncExternalStore(
    emptySubscribe,
    () => typeof IntersectionObserver !== "undefined",
    () => true,
  );
  const loadTriggerRef = useRef<HTMLElement | null>(null);
  const requestInFlightRef = useRef(false);
  const requestControllerRef = useRef<AbortController | null>(null);
  const signedIn = initialCollectionEntries !== null;
  const items = useMemo(() => uniqueCards(batches), [batches]);
  const lastBatch = batches.at(-1);
  const lastBatchStart = items.length - (lastBatch?.items.length ?? 0);
  const loadTriggerIndex = lastBatch?.items.length
    ? lastBatchStart + Math.ceil(lastBatch.items.length * 0.6) - 1
    : -1;

  const updateCollectionEntry = useCallback((entry: CollectionEntryState) => {
    setCollectionEntries((current) => {
      const next = new Map(current);
      next.set(entry.cardId, entry);
      return next;
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (
      navigationMode !== "infinite" ||
      !nextCursor ||
      requestInFlightRef.current
    ) {
      return;
    }

    requestInFlightRef.current = true;
    setIsLoading(true);
    setLoadError(false);
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      const searchParams = cardsApiSearchParams(
        locale,
        query,
        currentPage + 1,
        nextCursor,
      );
      const response = await fetch(`/api/cards/page?${searchParams}`, {
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("CARD_PAGE_UNAVAILABLE");

      const page = (await response.json()) as CardPageResponse;
      if (!Array.isArray(page.items)) {
        throw new Error("INVALID_CARD_PAGE");
      }

      setBatches((current) => [
        ...current,
        { items: page.items, fetchedCount: page.fetchedCount },
      ]);
      setNextCursor(page.nextCursor);
      setCurrentPage(page.page);
      setPageCount(page.pageCount);
      if (page.collectionEntries) {
        setCollectionEntries((current) => {
          const next = new Map(current);
          for (const entry of page.collectionEntries ?? []) {
            next.set(entry.cardId, entry);
          }
          return next;
        });
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setLoadError(true);
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        requestInFlightRef.current = false;
        setIsLoading(false);
      }
    }
  }, [currentPage, locale, navigationMode, nextCursor, query]);

  useEffect(() => {
    return () => requestControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (navigationMode !== "infinite") return;

    const updateVisibility = () => setShowBackToTop(window.scrollY > 900);
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, [navigationMode]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const target = loadTriggerRef.current;
    if (
      navigationMode !== "infinite" ||
      !nextCursor ||
      isLoading ||
      loadError ||
      !target
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "0px 0px 240px", threshold: 0.05 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [
    batches.length,
    isLoading,
    loadError,
    loadMore,
    navigationMode,
    nextCursor,
  ]);

  const collectionEntryFor = (card: CardListItem) =>
    signedIn
      ? collectionEntries.get(card.id) ?? emptyCollectionEntry(card.id)
      : undefined;
  const isInfinite = navigationMode === "infinite";
  const showManualLoad =
    isInfinite &&
    Boolean(nextCursor) &&
    (!supportsAutomaticLoading || loadTriggerIndex < 0);

  return (
    <>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {isInfinite
          ? results("infiniteLoaded", { count: items.length })
          : query.q
            ? results("filteredOnPage", { count: items.length })
            : results("loaded", { count: fetchedCount })}
        {!isInfinite && pageCount > 1
          ? ` ${results("page", { page: query.page, pages: pageCount })}`
          : ""}
      </p>

      {items.length ? (
        <div
          className={
            query.view === "grid"
              ? "grid grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-5"
              : "space-y-2.5"
          }
          aria-busy={isLoading}
        >
          {items.map((card, index) =>
            query.view === "grid" ? (
              <CardPreview
                key={card.id}
                card={card}
                eager={index < 2}
                collectionEntry={collectionEntryFor(card)}
                onCollectionChange={updateCollectionEntry}
                loadMoreRef={
                  isInfinite && index === loadTriggerIndex
                    ? loadTriggerRef
                    : undefined
                }
              />
            ) : (
              <CardListRow
                key={card.id}
                card={card}
                collectionEntry={collectionEntryFor(card)}
                onCollectionChange={updateCollectionEntry}
                loadMoreRef={
                  isInfinite && index === loadTriggerIndex
                    ? loadTriggerRef
                    : undefined
                }
              />
            ),
          )}
          {isInfinite && isLoading
            ? Array.from({ length: query.view === "grid" ? 5 : 3 }, (_, index) => (
                <div
                  key={`loading-${index}`}
                  className={
                    query.view === "grid"
                      ? "aspect-[5/8] animate-pulse rounded-[1.35rem] bg-muted"
                      : "h-24 animate-pulse rounded-2xl bg-muted"
                  }
                  aria-hidden="true"
                />
              ))
            : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed px-6 py-20 text-center">
          <SearchX className="mx-auto size-9 text-muted-foreground/55" />
          <h2 className="mt-4 font-heading text-xl font-semibold">
            {results("emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {results("emptyDescription")}
          </p>
          <Button
            className="mt-6"
            nativeButton={false}
            render={
              <Link
                href={query.view === "list" ? "/cards?view=list" : "/cards"}
              />
            }
          >
            {results("reset")}
          </Button>
        </div>
      )}

      {isInfinite ? (
        <div className="border-t pt-6 text-center" aria-live="polite">
          {isLoading ? (
            <p className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              {results("loadingMore")}
            </p>
          ) : loadError ? (
            <div>
              <p className="text-sm text-muted-foreground">
                {results("loadMoreError")}
              </p>
              <Button type="button" variant="outline" className="mt-3" onClick={() => void loadMore()}>
                {results("retry")}
              </Button>
            </div>
          ) : showManualLoad ? (
            <Button type="button" variant="outline" onClick={() => void loadMore()}>
              {results("loadMore")}
            </Button>
          ) : !nextCursor && items.length ? (
            <p className="text-xs text-muted-foreground">
              {results("endOfCatalogue", { count: items.length })}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {results("automaticLoading")}
            </p>
          )}
        </div>
      ) : pageCount > 1 ? (
        <nav
          className="flex items-center justify-between gap-4 border-t pt-6"
          aria-label={results("paginationLabel")}
        >
          {previousCursor ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link
                  href={cardsHref(query, {
                    page: query.page - 1,
                    cursor:
                      query.page - 1 === 1 ? undefined : previousCursor,
                    cursorDirection: "before",
                  })}
                  prefetch={false}
                  aria-label={results("previous")}
                />
              }
            >
              <ChevronLeft />
              <span className="hidden sm:inline">{results("previous")}</span>
            </Button>
          ) : (
            <Button variant="outline" disabled aria-label={results("previous")}>
              <ChevronLeft />
              <span className="hidden sm:inline">{results("previous")}</span>
            </Button>
          )}
          <div className="text-center">
            <p className="text-sm font-semibold tabular-nums">
              {results("page", { page: query.page, pages: pageCount })}
            </p>
            <p className="mt-0.5 text-[0.68rem] text-muted-foreground">
              {results("perPage", { count: fetchedCount })}
            </p>
          </div>
          {initialNextCursor ? (
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <Link
                  href={cardsHref(query, {
                    page: query.page + 1,
                    cursor: initialNextCursor,
                    cursorDirection: "after",
                  })}
                  prefetch={false}
                  aria-label={results("next")}
                />
              }
            >
              <span className="hidden sm:inline">{results("next")}</span>
              <ChevronRight />
            </Button>
          ) : (
            <Button variant="outline" disabled aria-label={results("next")}>
              <span className="hidden sm:inline">{results("next")}</span>
              <ChevronRight />
            </Button>
          )}
        </nav>
      ) : null}

      {isInfinite && showBackToTop ? (
        <Button
          type="button"
          size="icon-lg"
          className="fixed right-4 bottom-4 z-40 rounded-full shadow-[0_16px_45px_-16px_rgb(0_0_0/0.55)] sm:right-6 sm:bottom-6"
          onClick={() => {
            const reducedMotion = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches;
            window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
          }}
          aria-label={results("backToTop")}
          title={results("backToTop")}
        >
          <ArrowUp />
        </Button>
      ) : null}
    </>
  );
}
