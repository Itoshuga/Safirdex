import assert from "node:assert/strict";

import { validateDeck } from "../src/features/decks/rules/validate-deck.ts";
import type {
  DeckRuleCard,
  DeckRuleEntry,
} from "../src/features/decks/types";
import type { GameplayCardKind } from "../src/types/card";

function card(
  id: string,
  gameplayKind: GameplayCardKind = "combatant",
  factionIds = ["sky"],
): DeckRuleCard {
  return { id, gameplayCardId: id, gameplayKind, factionIds, value: 1 };
}

function entry(
  id: string,
  quantity: number,
  gameplayKind: GameplayCardKind = "combatant",
  factionIds = ["sky"],
): DeckRuleEntry {
  return { cardId: id, quantity, card: card(id, gameplayKind, factionIds) };
}

const legalEntries = Array.from({ length: 15 }, (_, index) =>
  entry(`combatant-${index}`, 2),
);

assert.equal(validateDeck({ entries: legalEntries, commander: null }).isLegal, true);

const twentyNineCards = [...legalEntries.slice(0, 14), entry("last-main-card", 1)];
assert.equal(validateDeck({ entries: twentyNineCards, commander: null }).isLegal, false);
const thirtyWithCommander = validateDeck({
  entries: twentyNineCards,
  commander: card("leader", "commander"),
});
assert.equal(thirtyWithCommander.cardCount, 30);
assert.equal(thirtyWithCommander.mainDeckCardCount, 29);
assert.equal(thirtyWithCommander.isLegal, true);

const fortyCards = Array.from({ length: 20 }, (_, index) => entry(`forty-${index}`, 2));
assert.equal(validateDeck({ entries: fortyCards, commander: null }).isLegal, true);
assert.ok(validateDeck({ entries: [...fortyCards, entry("forty-one", 1)], commander: null }).issues.some((issue) => issue.code === "deck_above_maximum"));

const tooSmall = validateDeck({ entries: legalEntries.slice(0, 14), commander: null });
assert.equal(tooSmall.status, "incomplete");
assert.ok(tooSmall.issues.some((issue) => issue.code === "deck_below_minimum"));

const tooManyCopies = validateDeck({
  entries: [entry("same", 3), ...legalEntries.slice(1)],
  commander: null,
});
assert.equal(tooManyCopies.status, "invalid");
assert.ok(
  tooManyCopies.issues.some((issue) => issue.code === "too_many_copies"),
);

const commanderInDeck = validateDeck({
  entries: [entry("leader", 1, "commander"), ...legalEntries],
  commander: card("leader", "commander"),
});
assert.ok(
  commanderInDeck.issues.some(
    (issue) => issue.code === "commander_in_main_deck",
  ),
);

const incompatibleCommander = validateDeck({
  entries: legalEntries.map((item) => ({
    ...item,
    card: { ...item.card, factionIds: ["earth"] },
  })),
  commander: card("leader", "commander", ["sky"]),
});
assert.equal(incompatibleCommander.status, "incomplete");
assert.ok(
  incompatibleCommander.issues.some(
    (issue) => issue.code === "not_enough_compatible_combatants",
  ),
);

const fourteenCompatible = validateDeck({
  entries: [
    ...Array.from({ length: 14 }, (_, index) => entry(`match-14-${index}`, 1)),
    ...Array.from({ length: 15 }, (_, index) => entry(`other-14-${index}`, 1, "combatant", ["earth"])),
  ],
  commander: card("leader-14", "commander", ["sky"]),
});
assert.equal(fourteenCompatible.cardCount, 30);
assert.ok(fourteenCompatible.issues.some((issue) => issue.code === "not_enough_compatible_combatants"));

const fifteenCompatible = validateDeck({
  entries: [
    ...Array.from({ length: 15 }, (_, index) => entry(`match-15-${index}`, 1, "combatant", ["sky", "air"])),
    ...Array.from({ length: 14 }, (_, index) => entry(`other-15-${index}`, 1, "combatant", ["earth"])),
  ],
  commander: card("leader-15", "commander", ["air"]),
});
assert.equal(fifteenCompatible.compatibleCombatantsCount, 15);
assert.equal(fifteenCompatible.isLegal, true);

const commanderRemoved = validateDeck({ entries: twentyNineCards, commander: null });
assert.equal(commanderRemoved.isLegal, false);
assert.equal(validateDeck({ entries: [...twentyNineCards, entry("quantity-change", 1)], commander: null }).isLegal, true);

const sameGameplayCard = validateDeck({
  entries: [
    { ...entry("art-a", 2), card: { ...card("art-a"), gameplayCardId: "kyu" } },
    { ...entry("art-b", 1), card: { ...card("art-b"), gameplayCardId: "kyu" } },
    ...legalEntries.slice(2),
  ],
  commander: null,
});
assert.ok(
  sameGameplayCard.issues.some((issue) => issue.code === "too_many_copies"),
);

console.log("Deck rules verification passed.");
