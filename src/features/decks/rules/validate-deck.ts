import type {
  DeckRuleInput,
  DeckRuleIssue,
  DeckRuleResult,
} from "@/features/decks/types";
import type { GameplayCardKind } from "@/types/card";

import { SAFIR_STANDARD_RULESET } from "./ruleset.ts";
import type { DeckRulesetConfig } from "./ruleset.ts";

const EMPTY_KIND_COUNTS: Record<GameplayCardKind, number> = {
  combatant: 0,
  spell: 0,
  token: 0,
  commander: 0,
};

export function isCombatantCompatibleWithCommander(
  combatantFactionIds: string[],
  commanderFactionIds: string[],
) {
  if (commanderFactionIds.length === 0) return false;
  return combatantFactionIds.some((factionId) =>
    commanderFactionIds.includes(factionId),
  );
}

export function calculateDeckStats(
  input: DeckRuleInput,
  ruleset: DeckRulesetConfig = SAFIR_STANDARD_RULESET,
) {
  const kindCounts = { ...EMPTY_KIND_COUNTS };
  const factionCounts: Record<string, number> = {};
  let mainDeckCardCount = 0;
  let totalValue = 0;
  let compatibleCombatantsCount = 0;

  for (const entry of input.entries) {
    const quantity = Math.max(0, Math.trunc(entry.quantity));
    mainDeckCardCount += quantity;
    totalValue += entry.card.value * quantity;
    kindCounts[entry.card.gameplayKind] += quantity;
    for (const factionId of entry.card.factionIds) {
      factionCounts[factionId] = (factionCounts[factionId] ?? 0) + quantity;
    }
    if (
      input.commander &&
      entry.card.gameplayKind === "combatant" &&
      isCombatantCompatibleWithCommander(
        entry.card.factionIds,
        input.commander.factionIds,
      )
    ) {
      compatibleCombatantsCount += quantity;
    }
  }

  const commanderCount = input.commander ? 1 : 0;
  if (input.commander) {
    kindCounts.commander += 1;
    totalValue += input.commander.value;
    for (const factionId of input.commander.factionIds) {
      factionCounts[factionId] = (factionCounts[factionId] ?? 0) + 1;
    }
  }
  const cardCount = mainDeckCardCount +
    (ruleset.commander.countsTowardDeckSize ? commanderCount : 0);

  return {
    cardCount,
    mainDeckCardCount,
    commanderCount,
    compatibleCombatantsCount,
    totalValue,
    kindCounts,
    factionCounts,
  };
}

export function getDeckRuleProgress(
  input: DeckRuleInput,
  ruleset: DeckRulesetConfig = SAFIR_STANDARD_RULESET,
) {
  const stats = calculateDeckStats(input, ruleset);
  return {
    totalCards: {
      current: stats.cardCount,
      min: ruleset.deckSize.min,
      max: ruleset.deckSize.max,
    },
    ...(input.commander
      ? {
          commanderFactionCombatants: {
            current: stats.compatibleCombatantsCount,
            required: ruleset.commander.minimumFactionCombatants,
          },
        }
      : {}),
  };
}

export function validateDeck(
  input: DeckRuleInput,
  ruleset: DeckRulesetConfig = SAFIR_STANDARD_RULESET,
): DeckRuleResult {
  const issues: DeckRuleIssue[] = [];
  const copiesByGameplayCard = new Map<string, number>();
  const stats = calculateDeckStats(input, ruleset);

  for (const entry of input.entries) {
    const quantity = Math.max(0, Math.trunc(entry.quantity));
    const nextCopies =
      (copiesByGameplayCard.get(entry.card.gameplayCardId) ?? 0) + quantity;
    copiesByGameplayCard.set(entry.card.gameplayCardId, nextCopies);
    if (entry.card.gameplayKind === "commander" && quantity > 0) {
      issues.push({
        code: "commander_in_main_deck",
        cardId: entry.cardId,
        actual: quantity,
      });
    }
  }

  for (const [gameplayCardId, quantity] of copiesByGameplayCard) {
    if (quantity > ruleset.maxCopiesPerGameplayCard) {
      issues.push({
        code: "too_many_copies",
        cardId: gameplayCardId,
        actual: quantity,
        expected: ruleset.maxCopiesPerGameplayCard,
      });
    }
  }

  if (stats.cardCount < ruleset.deckSize.min) {
    issues.push({
      code: "deck_below_minimum",
      actual: stats.cardCount,
      expected: ruleset.deckSize.min,
    });
  }

  if (stats.cardCount > ruleset.deckSize.max) {
    issues.push({
      code: "deck_above_maximum",
      actual: stats.cardCount,
      expected: ruleset.deckSize.max,
    });
  }

  if (input.commander) {
    if (!ruleset.commander.enabled || input.commander.gameplayKind !== "commander") {
      issues.push({
        code: "invalid_commander",
        cardId: input.commander.id,
      });
    }

    if (
      stats.compatibleCombatantsCount <
      ruleset.commander.minimumFactionCombatants
    ) {
      issues.push({
        code: "not_enough_compatible_combatants",
        actual: stats.compatibleCombatantsCount,
        expected: ruleset.commander.minimumFactionCombatants,
      });
    }
  }

  const onlyIncompleteIssues = issues.every(
    (issue) =>
      issue.code === "deck_below_minimum" ||
      issue.code === "not_enough_compatible_combatants",
  );
  const status =
    issues.length === 0 ? "legal" : onlyIncompleteIssues ? "incomplete" : "invalid";

  return {
    status,
    isLegal: issues.length === 0,
    issues,
    errors: issues,
    warnings: [],
    ...stats,
    progress: getDeckRuleProgress(input, ruleset),
  };
}
