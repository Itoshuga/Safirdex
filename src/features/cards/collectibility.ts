import type { Card } from "@/types/card";

/** Tokens are game aids rather than collectible cards in the first release. */
export function isCollectibleCard(
  card: Pick<Card, "gameplayKind">,
) {
  return card.gameplayKind !== "token";
}
