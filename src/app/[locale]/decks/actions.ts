"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { COMMUNITY_CACHE_TAGS } from "@/features/community/server/cache-tags";
import type { DeckActionState } from "@/features/decks/action-state";
import type { DeckCatalogQuery } from "@/features/decks/types";
import {
  deleteDeck,
  getBuilderCatalogPage,
  saveDeck,
} from "@/features/decks/server/deck-service";
import { getUserSession } from "@/lib/auth/user-session";
import { saveDeckPayloadSchema } from "@/validation/decks";

export async function saveDeckAction(
  _state: DeckActionState,
  formData: FormData,
): Promise<DeckActionState> {
  const session = await getUserSession();
  if (!session) return { status: "error", message: "AUTH_REQUIRED" };
  try {
    const payload = saveDeckPayloadSchema.parse({
      draft: JSON.parse(String(formData.get("payload") ?? "{}")),
      intent: String(formData.get("intent") ?? "draft"),
    });
    const deckId = await saveDeck({ userId: session.uid, ...payload });
    revalidatePath("/[locale]/decks", "page");
    revalidatePath(`/[locale]/decks/${deckId}`, "page");
    revalidateTag(COMMUNITY_CACHE_TAGS.profiles, "max");
    return { status: "success", message: "DECK_SAVED", deckId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "DECK_SAVE_FAILED";
    return { status: "error", message };
  }
}

export async function deleteDeckAction(deckId: string) {
  const session = await getUserSession();
  if (!session) throw new Error("AUTH_REQUIRED");
  await deleteDeck(session.uid, deckId);
  revalidatePath("/[locale]/decks", "page");
  revalidateTag(COMMUNITY_CACHE_TAGS.profiles, "max");
}

export async function loadDeckCardsAction(locale: string, query: DeckCatalogQuery, cursor?: string) {
  return getBuilderCatalogPage({ locale, cursor, query });
}

export async function loadDeckCommandersAction(locale: string, cursor?: string) {
  return getBuilderCatalogPage({ locale, cursor, commanderOnly: true });
}
