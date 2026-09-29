import type { HomeCardSearchItem } from "@/features/cards/types";

export const HOME_SEARCH_LIMIT = 5;
export const HOME_SEARCH_DEBOUNCE_MS = 350;

export function normalizeCardSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function matchScore(name: string, query: string) {
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.split(/\s+/).some((word) => word.startsWith(query))) return 2;
  if (name.includes(query)) return 3;
  return null;
}

export function searchHomeCards(
  cards: HomeCardSearchItem[],
  query: string,
  limit = HOME_SEARCH_LIMIT,
) {
  const normalizedQuery = normalizeCardSearch(query);
  if (!normalizedQuery) return [];

  return cards
    .flatMap((card) => {
      const normalizedName = normalizeCardSearch(card.name);
      const score = matchScore(normalizedName, normalizedQuery);
      return score === null ? [] : [{ card, score, normalizedName }];
    })
    .sort((left, right) =>
      left.score - right.score ||
      left.normalizedName.length - right.normalizedName.length ||
      left.card.number - right.card.number,
    )
    .slice(0, limit)
    .map(({ card }) => card);
}
