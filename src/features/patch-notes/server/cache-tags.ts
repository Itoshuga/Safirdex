export const PATCH_NOTES_CACHE_TAGS = {
  listing: "patch-notes:listing",
  latest: "patch-notes:latest",
  detail: (slug: string) => `patch-notes:detail:${slug}`,
} as const;
