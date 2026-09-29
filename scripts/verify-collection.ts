import assert from "node:assert/strict";

import {
  calculateCollectionStats,
  collectionEntryState,
  duplicateQuantity,
  emptyCollectionEntry,
  isValidTradeQuantity,
  publicTradeDiscord,
} from "../src/features/collection/domain.ts";

assert.equal(duplicateQuantity(0), 0);
assert.equal(duplicateQuantity(1), 0);
assert.equal(duplicateQuantity(4), 3);

assert.deepEqual(emptyCollectionEntry("card-a"), {
  cardId: "card-a",
  ownedQuantity: 0,
  duplicateQuantity: 0,
  tradeQuantity: 0,
});
assert.deepEqual(collectionEntryState("card-a", 3, 8), {
  cardId: "card-a",
  ownedQuantity: 3,
  duplicateQuantity: 2,
  tradeQuantity: 2,
});
assert.deepEqual(collectionEntryState("card-a", 1, 1), {
  cardId: "card-a",
  ownedQuantity: 1,
  duplicateQuantity: 0,
  tradeQuantity: 0,
});

const stats = calculateCollectionStats([
  collectionEntryState("a", 3, 2),
  collectionEntryState("b", 1, 0),
  collectionEntryState("c", 0, 0),
], 8);
assert.equal(stats.uniqueOwnedCards, 2);
assert.equal(stats.totalOwnedCopies, 4);
assert.equal(stats.duplicateCopies, 2);
assert.equal(stats.tradeCopies, 2);
assert.equal(stats.tradeUniqueCards, 1);
assert.equal(stats.completionPercentage, 25);

assert.equal(isValidTradeQuantity(1, 1), false);
assert.equal(isValidTradeQuantity(2, 1), true);
assert.equal(isValidTradeQuantity(4, 3), true);
assert.equal(isValidTradeQuantity(4, 4), false);
assert.equal(collectionEntryState("a", 2, 3).tradeQuantity, 1);
assert.equal(collectionEntryState("a", 0, 0).ownedQuantity, 0);

const privateDiscord = { showTradesPublicly: true, showDiscordForTrades: false, discord: "player.name" };
assert.equal(publicTradeDiscord(privateDiscord), undefined);
assert.equal(publicTradeDiscord({ ...privateDiscord, showDiscordForTrades: true }), "player.name");

console.info("Collection domain checks passed.");
