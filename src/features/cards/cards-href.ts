import type { CodexQueryState } from "@/features/cards/types";

export function cardsHref(
  query: CodexQueryState,
  overrides: {
    view?: CodexQueryState["view"];
    page?: number;
    cursor?: string;
    cursorDirection?: CodexQueryState["cursorDirection"];
  } = {},
) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.season) params.set("season", query.season);
  if (query.set) params.set("set", query.set);
  if (query.rarity) params.set("rarity", query.rarity);
  if (query.type) params.set("type", query.type);
  if (query.commander !== undefined) {
    params.set("commander", String(query.commander));
  }
  if (query.promo !== undefined) params.set("promo", String(query.promo));
  if (query.sort !== "number") params.set("sort", query.sort);
  const view = overrides.view ?? query.view;
  const page = overrides.page ?? query.page;
  const cursor = overrides.cursor ?? query.cursor;
  const cursorDirection =
    overrides.cursorDirection ?? query.cursorDirection;
  if (view !== "grid") params.set("view", view);
  if (page > 1 && cursor) {
    params.set("page", String(page));
    params.set("cursor", cursor);
    if (cursorDirection === "before") params.set("direction", "before");
  }
  const serialized = params.toString();
  return serialized ? `/cards?${serialized}` : "/cards";
}

export function viewHref(
  query: CodexQueryState,
  view: CodexQueryState["view"],
) {
  return cardsHref(query, { view });
}

export function cardsApiSearchParams(
  locale: string,
  query: CodexQueryState,
  page: number,
  cursor: string,
) {
  const href = cardsHref(query, {
    page,
    cursor,
    cursorDirection: "after",
  });
  const [, serialized = ""] = href.split("?", 2);
  const params = new URLSearchParams(serialized);
  params.set("locale", locale);
  return params;
}
