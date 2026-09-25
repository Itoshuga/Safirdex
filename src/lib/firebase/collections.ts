export const FIRESTORE_COLLECTIONS = {
  cards: "cards",
  seasons: "seasons",
  sets: "sets",
  rarities: "rarities",
  cardTypes: "cardTypes",
  glossaryEntries: "glossaryEntries",
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];
