export interface DeckRulesetConfig {
  id: string;
  version: number;
  deckSize: { min: number; max: number };
  maxCopiesPerGameplayCard: number;
  commander: {
    enabled: boolean;
    max: number;
    countsTowardDeckSize: boolean;
    minimumFactionCombatants: number;
  };
}

export const SAFIR_STANDARD_RULESET = {
  id: "safir-standard-v1",
  version: 1,
  deckSize: { min: 30, max: 40 },
  maxCopiesPerGameplayCard: 2,
  commander: {
    enabled: true,
    max: 1,
    countsTowardDeckSize: true,
    minimumFactionCombatants: 15,
  },
} as const satisfies DeckRulesetConfig;
