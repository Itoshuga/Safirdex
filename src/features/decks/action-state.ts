export interface DeckActionState {
  status: "idle" | "success" | "error";
  message?: string;
  deckId?: string;
}

export const INITIAL_DECK_ACTION_STATE: DeckActionState = {
  status: "idle",
};
