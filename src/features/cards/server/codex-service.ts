import "server-only";

import { unstable_cache } from "next/cache";
import { z } from "zod";

import { CODEX_CACHE_TAGS } from "@/features/cards/server/cache-tags";
import { CARD_PAGE_SIZE } from "@/features/cards/server/query-types";
import type {
  CardDetailItem,
  CardListItem,
  CodexFilterOptions,
  CodexPageData,
  CodexQueryState,
  HomeCardSearchItem,
} from "@/features/cards/types";
import { tokenizeGlossaryContent } from "@/lib/glossary/references";
import {
  getTranslation,
  getLocalizedDescription,
  getLocalizedName,
} from "@/lib/i18n/get-localized-value";
import { logCacheMiss } from "@/lib/firebase/read-logger";
import { cardTypesRepository } from "@/repositories/card-types.repository";
import { cardsRepository } from "@/repositories/cards.repository";
import { glossaryRepository } from "@/repositories/glossary.repository";
import { raritiesRepository } from "@/repositories/rarities.repository";
import { seasonsRepository } from "@/repositories/seasons.repository";
import { setsRepository } from "@/repositories/sets.repository";
import type { Card } from "@/types/card";

const rawQuerySchema = z.object({
  q: z.string().trim().max(120).catch("").default(""),
  season: z.string().trim().max(160).optional().catch(undefined),
  set: z.string().trim().max(160).optional().catch(undefined),
  rarity: z.string().trim().max(160).optional().catch(undefined),
  type: z.string().trim().max(160).optional().catch(undefined),
  commander: z.enum(["true", "false"]).optional().catch(undefined),
  promo: z.enum(["true", "false"]).optional().catch(undefined),
  sort: z.enum(["number", "newest", "oldest"]).catch("number").default("number"),
  view: z.enum(["grid", "list"]).catch("grid").default("grid"),
  cursor: z.string().trim().max(1_000).optional().catch(undefined),
});

type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const getCachedSeasons = unstable_cache(
  async () => {
    logCacheMiss("codex seasons");
    return (await seasonsRepository.getAll()).map((entity) => ({
      id: entity.id,
      slug: entity.slug,
      translations: entity.translations,
    }));
  },
  ["codex-reference-seasons-v1"],
  { tags: [CODEX_CACHE_TAGS.seasons], revalidate: 86_400 },
);

const getCachedSets = unstable_cache(
  async () => {
    logCacheMiss("codex sets");
    return (await setsRepository.getAll()).map((entity) => ({
      id: entity.id,
      slug: entity.slug,
      seasonId: entity.seasonId,
      translations: entity.translations,
    }));
  },
  ["codex-reference-sets-v1"],
  { tags: [CODEX_CACHE_TAGS.sets], revalidate: 86_400 },
);

const getCachedRarities = unstable_cache(
  async () => {
    logCacheMiss("codex rarities");
    return (await raritiesRepository.getAll()).map((entity) => ({
      id: entity.id,
      slug: entity.slug,
      order: entity.order,
      translations: entity.translations,
      color: entity.visual?.color,
    }));
  },
  ["codex-reference-rarities-v1"],
  { tags: [CODEX_CACHE_TAGS.rarities], revalidate: 86_400 },
);

const getCachedTypes = unstable_cache(
  async () => {
    logCacheMiss("codex card types");
    return (await cardTypesRepository.getAll()).map((entity) => ({
      id: entity.id,
      slug: entity.slug,
      translations: entity.translations,
      color: entity.visual?.color,
    }));
  },
  ["codex-reference-types-v1"],
  { tags: [CODEX_CACHE_TAGS.types], revalidate: 86_400 },
);

const getCachedGlossary = unstable_cache(
  async () => {
    logCacheMiss("codex glossary");
    return (await glossaryRepository.getAll()).map((entry) => ({
      key: entry.key,
      translations: entry.translations,
    }));
  },
  ["codex-glossary-v1"],
  { tags: [CODEX_CACHE_TAGS.glossary], revalidate: 86_400 },
);

function localizeReferences(
  locale: string,
  sources: Awaited<ReturnType<typeof getReferenceSources>>,
): CodexFilterOptions {
  return {
    seasons: sources.seasons.map((entity) => ({
      id: entity.id,
      slug: entity.slug,
      name: getLocalizedName(entity.translations, locale),
    })),
    sets: sources.sets.map((entity) => ({
      id: entity.id,
      slug: entity.slug,
      seasonId: entity.seasonId,
      name: getLocalizedName(entity.translations, locale),
    })),
    rarities: sources.rarities.map((entity) => ({
      id: entity.id,
      slug: entity.slug,
      name: getLocalizedName(entity.translations, locale),
      color: entity.color,
    })),
    types: sources.types.map((entity) => ({
      id: entity.id,
      slug: entity.slug,
      name: getLocalizedName(entity.translations, locale),
      color: entity.color,
    })),
  };
}

export async function getCodexFilterOptions(locale: string) {
  return localizeReferences(locale, await getReferenceSources());
}

async function getReferenceSources() {
  const [seasons, sets, rarities, types] = await Promise.all([
    getCachedSeasons(),
    getCachedSets(),
    getCachedRarities(),
    getCachedTypes(),
  ]);
  return { seasons, sets, rarities, types };
}

function localizedEntity(
  entity:
    | NonNullable<Card["display"]>["season"]
    | NonNullable<Card["display"]>["set"]
    | undefined,
  locale: string,
) {
  if (!entity) return null;
  return {
    id: entity.id,
    slug: entity.slug,
    name: getLocalizedName(entity.translations, locale),
  };
}

function toListItem(card: Card, locale: string): CardListItem {
  const translation = getTranslation(card.translations, locale);
  const display = card.display;
  const artworkTranslation = getTranslation(card.artwork.translations, locale);

  return {
    id: card.id,
    number: card.number,
    slug: card.slug,
    name: translation?.name ?? `#${card.number}`,
    attack: card.attack,
    value: card.value,
    defense: card.defense,
    isCommander: card.isCommander,
    isPromo: card.isPromo,
    artwork: {
      url: card.artwork.url,
      orientation: card.artwork.orientation,
      alt: artworkTranslation?.alt ?? translation?.name ?? `#${card.number}`,
    },
    season: localizedEntity(display?.season, locale),
    set: localizedEntity(display?.set, locale),
    rarity: display?.rarity
      ? {
          id: display.rarity.id,
          slug: display.rarity.slug,
          name: getLocalizedName(display.rarity.translations, locale),
          order: display.rarity.order,
          color: display.rarity.visual?.color,
          iconUrl: display.rarity.visual?.iconUrl,
        }
      : null,
    types:
      display?.types.map((type) => ({
        id: type.id,
        slug: type.slug,
        name: getLocalizedName(type.translations, locale),
        color: type.visual?.color,
        iconUrl: type.visual?.iconUrl,
      })) ?? [],
    relationIds: {
      seasonId: card.seasonId,
      setId: card.setId,
      rarityId: card.rarityId,
      typeIds: card.typeIds,
    },
  };
}

const getCachedPage = unstable_cache(
  async (
    locale: string,
    filters: Parameters<typeof cardsRepository.getPage>[0]["filters"],
    sort: CodexQueryState["sort"],
    cursor?: string,
  ) => {
    logCacheMiss(`codex cards (${locale}/${sort})`);
    const page = await cardsRepository.getPage({
      filters,
      sort,
      cursor,
      limit: CARD_PAGE_SIZE,
    });
    return {
      ...page,
      items: page.items.map((card) => toListItem(card, locale)),
    };
  },
  ["codex-card-pages-v1"],
  { tags: [CODEX_CACHE_TAGS.cards], revalidate: 300 },
);

const getCachedHomeCards = unstable_cache(
  async (locale: string): Promise<HomeCardSearchItem[]> => {
    logCacheMiss(`home card search (${locale})`);
    const cards = await cardsRepository.getAll();

    return cards.map((card) => {
      const translation = getTranslation(card.translations, locale);
      return {
        id: card.id,
        slug: card.slug,
        number: card.number,
        name: translation?.name ?? `#${card.number}`,
        description: translation?.description ?? "",
        attack: card.attack,
        value: card.value,
        defense: card.defense,
        isCommander: card.isCommander,
        isPromo: card.isPromo,
        rarityName: card.display?.rarity
          ? getLocalizedName(card.display.rarity.translations, locale)
          : "",
        typeNames:
          card.display?.types.map((type) =>
            getLocalizedName(type.translations, locale),
          ) ?? [],
      };
    });
  },
  ["codex-home-card-search-v1"],
  { tags: [CODEX_CACHE_TAGS.cards], revalidate: 3_600 },
);

export async function getHomeCodexCards(locale: string) {
  return getCachedHomeCards(locale);
}

function parseQuery(searchParams: RawSearchParams, options: CodexFilterOptions) {
  const parsed = rawQuerySchema.parse(
    Object.fromEntries(
      Object.entries(searchParams).map(([key, value]) => [key, first(value)]),
    ),
  );
  const known = (slug: string | undefined, values: Array<{ slug: string }>) =>
    slug && values.some((value) => value.slug === slug) ? slug : undefined;

  return {
    q: parsed.q,
    season: known(parsed.season, options.seasons),
    set: known(parsed.set, options.sets),
    rarity: known(parsed.rarity, options.rarities),
    type: known(parsed.type, options.types),
    commander:
      parsed.commander === undefined ? undefined : parsed.commander === "true",
    promo: parsed.promo === undefined ? undefined : parsed.promo === "true",
    sort: parsed.sort,
    view: parsed.view,
    cursor: parsed.cursor,
  } satisfies CodexQueryState;
}

function findId(slug: string | undefined, values: Array<{ slug: string; id: string }>) {
  return slug ? values.find((value) => value.slug === slug)?.id : undefined;
}

export async function getCodexPage(
  locale: string,
  searchParams: RawSearchParams,
): Promise<CodexPageData> {
  const sources = await getReferenceSources();
  const options = localizeReferences(locale, sources);
  const query = parseQuery(searchParams, options);
  const resolvedFilters = {
    seasonId: findId(query.season, options.seasons),
    setId: findId(query.set, options.sets),
    rarityId: findId(query.rarity, options.rarities),
    typeId: findId(query.type, options.types),
    isCommander: query.commander,
    isPromo: query.promo,
  };
  // One selective Firestore predicate keeps the index set finite. Additional
  // active filters are applied to the bounded 24-card page below.
  const firestoreFilters = resolvedFilters.typeId
    ? { typeId: resolvedFilters.typeId }
    : resolvedFilters.setId
      ? { setId: resolvedFilters.setId }
      : resolvedFilters.seasonId
        ? { seasonId: resolvedFilters.seasonId }
        : resolvedFilters.rarityId
          ? { rarityId: resolvedFilters.rarityId }
          : resolvedFilters.isCommander !== undefined
            ? { isCommander: resolvedFilters.isCommander }
            : resolvedFilters.isPromo !== undefined
              ? { isPromo: resolvedFilters.isPromo }
              : {};
  const page = await getCachedPage(
    locale,
    firestoreFilters,
    query.sort,
    query.cursor,
  );

  const normalizedSearch = query.q.toLocaleLowerCase(locale);
  const items = page.items.filter((card) => {
    const matchesFilters =
      (!resolvedFilters.seasonId || card.relationIds.seasonId === resolvedFilters.seasonId) &&
      (!resolvedFilters.setId || card.relationIds.setId === resolvedFilters.setId) &&
      (!resolvedFilters.rarityId || card.relationIds.rarityId === resolvedFilters.rarityId) &&
      (!resolvedFilters.typeId || card.relationIds.typeIds.includes(resolvedFilters.typeId)) &&
      (resolvedFilters.isCommander === undefined || card.isCommander === resolvedFilters.isCommander) &&
      (resolvedFilters.isPromo === undefined || card.isPromo === resolvedFilters.isPromo);
    const matchesSearch =
      !normalizedSearch ||
      card.name.toLocaleLowerCase(locale).includes(normalizedSearch) ||
      String(card.number).includes(normalizedSearch.replace(/^#/, ""));
    return matchesFilters && matchesSearch;
  });

  return {
    items,
    options,
    query,
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
    fetchedCount: page.items.length,
  };
}

export async function getCardDetails(
  slug: string,
  locale: string,
): Promise<CardDetailItem | null> {
  return unstable_cache(
    async () => {
      logCacheMiss(`codex card detail (${slug}/${locale})`);
      const [card, glossaryEntries] = await Promise.all([
        cardsRepository.getBySlug(slug),
        getCachedGlossary(),
      ]);
      if (!card) return null;

      const item = toListItem(card, locale);
      const description = getLocalizedDescription(card.translations, locale);
      const referencedKeys = new Set(
        tokenizeGlossaryContent(description)
          .filter((token) => token.type === "glossary")
          .map((token) => token.key),
      );
      const glossary = Object.fromEntries(
        glossaryEntries.flatMap((entry) => {
          if (!referencedKeys.has(entry.key)) return [];
          const translation = getTranslation(entry.translations, locale);
          return translation ? [[entry.key, translation]] : [];
        }),
      );

      return {
        ...item,
        description,
        alternativeArtworks: [...card.alternativeArtworks]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((artwork) => {
            const translation = getTranslation(artwork.translations, locale);
            return {
              id: artwork.id,
              url: artwork.url,
              orientation: artwork.orientation,
              name: translation?.name ?? item.name,
              alt: translation?.alt ?? translation?.name ?? item.name,
            };
          }),
        glossary,
      };
    },
    ["codex-card-detail-v1", slug, locale],
    {
      tags: [
        CODEX_CACHE_TAGS.cards,
        CODEX_CACHE_TAGS.card(slug),
        CODEX_CACHE_TAGS.glossary,
      ],
      revalidate: 3_600,
    },
  )();
}
