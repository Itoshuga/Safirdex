export const COMMUNITY_CACHE_TAGS = {
  profiles: "community:profiles",
  discover: "community:discover",
  profile: (usernameNormalized: string) =>
    `community:profile:${usernameNormalized}`,
} as const;

