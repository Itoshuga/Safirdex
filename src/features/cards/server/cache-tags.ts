export const CODEX_CACHE_TAGS = {
  cards: "codex:cards",
  seasons: "codex:references:seasons",
  sets: "codex:references:sets",
  rarities: "codex:references:rarities",
  types: "codex:references:types",
  factions: "codex:references:factions",
  glossary: "codex:glossary",
  card: (slug: string) => `codex:card:${slug}`,
} as const;
