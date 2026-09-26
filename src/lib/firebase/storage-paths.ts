const STORAGE_SEGMENT_PATTERN = /^[a-zA-Z0-9_-]+$/;

function assertStorageSegment(value: string, label: string) {
  if (!STORAGE_SEGMENT_PATTERN.test(value)) {
    throw new Error(
      `${label} must only contain letters, numbers, underscores, or hyphens.`,
    );
  }

  return value;
}

export const STORAGE_ROOTS = {
  cards: "cards",
  seasons: "seasons",
  rarities: "rarities",
  cardTypes: "card-types",
  factions: "factions",
} as const;

export const storagePaths = {
  cardMainArtwork(cardId: string, extension = "webp") {
    return `${STORAGE_ROOTS.cards}/${assertStorageSegment(cardId, "cardId")}/main/artwork.${assertStorageSegment(extension, "extension")}`;
  },

  cardAlternativeArtwork(
    cardId: string,
    artworkId: string,
    extension = "webp",
  ) {
    return `${STORAGE_ROOTS.cards}/${assertStorageSegment(cardId, "cardId")}/alternatives/${assertStorageSegment(artworkId, "artworkId")}.${assertStorageSegment(extension, "extension")}`;
  },

  seasonCover(seasonId: string, extension = "webp") {
    return `${STORAGE_ROOTS.seasons}/${assertStorageSegment(seasonId, "seasonId")}/cover.${assertStorageSegment(extension, "extension")}`;
  },

  rarityIcon(rarityId: string, extension = "svg") {
    return `${STORAGE_ROOTS.rarities}/${assertStorageSegment(rarityId, "rarityId")}/icon.${assertStorageSegment(extension, "extension")}`;
  },

  cardTypeIcon(cardTypeId: string, extension = "svg") {
    return `${STORAGE_ROOTS.cardTypes}/${assertStorageSegment(cardTypeId, "cardTypeId")}/icon.${assertStorageSegment(extension, "extension")}`;
  },

  factionIcon(factionId: string, extension = "svg") {
    return `${STORAGE_ROOTS.factions}/${assertStorageSegment(factionId, "factionId")}/icon.${assertStorageSegment(extension, "extension")}`;
  },
};
