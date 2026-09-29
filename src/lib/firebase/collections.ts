export const FIRESTORE_COLLECTIONS = {
  cards: "cards",
  cardViews: "cardViews",
  cardTrades: "cardTrades",
  seasons: "seasons",
  sets: "sets",
  rarities: "rarities",
  cardTypes: "cardTypes",
  factions: "factions",
  decks: "decks",
  glossaryEntries: "glossaryEntries",
  users: "users",
  publicProfiles: "publicProfiles",
  usernames: "usernames",
  communityActivities: "communityActivities",
  userFeeds: "userFeeds",
  pseudonyms: "pseudonyms",
  displayNames: "displayNames",
  patchNotes: "patchNotes",
  appConfig: "appConfig",
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];
