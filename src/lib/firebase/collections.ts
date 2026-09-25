export const FIRESTORE_COLLECTIONS = {
  cards: "cards",
  seasons: "seasons",
  sets: "sets",
  rarities: "rarities",
  cardTypes: "cardTypes",
  glossaryEntries: "glossaryEntries",
  users: "users",
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];
