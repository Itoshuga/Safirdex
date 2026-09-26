import "server-only";

import { FieldPath, FieldValue, Timestamp, type Query } from "firebase-admin/firestore";

import {
  recordDeckCreatedActivity,
  removeActivitiesForEntity,
  setDeckActivityPublished,
} from "@/features/community/server/activity-service";
import { ensurePublicProfileForUser } from "@/features/community/server/profile-service";
import { validateDeck } from "@/features/decks/rules/validate-deck";
import { SAFIR_STANDARD_RULESET } from "@/features/decks/rules/ruleset";
import type {
  DeckBuilderDraft,
  DeckCatalogQuery,
  DeckCatalogCard,
  DeckCardSnapshot,
  DeckDetailView,
  DeckDocument,
  DeckPreviewView,
  DeckPublicationStatus,
  DeckSort,
} from "@/features/decks/types";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import {
  getLocalizedDescription,
  getLocalizedName,
} from "@/lib/i18n/get-localized-value";
import { createSlug } from "@/lib/utils/slug";
import { cardsRepository } from "@/repositories/cards.repository";
import { factionsRepository } from "@/repositories/factions.repository";
import type { Card, GameplayCardKind } from "@/types/card";

const DECK_PAGE_SIZE = 20;
const BUILDER_PAGE_SIZE = 24;

function normalizeSearch(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ");
}

function searchTokens(...values: string[]) {
  return [
    ...new Set(
      values.flatMap((value) =>
        normalizeSearch(value)
          .split(" ")
          .filter((token) => token.length >= 2),
      ).flatMap((token) =>
        Array.from(
          { length: Math.min(token.length, 20) - 1 },
          (_, index) => token.slice(0, index + 2),
        ),
      ),
    ),
  ].slice(0, 40);
}

function searchQueryToken(value: string) {
  return normalizeSearch(value).split(" ")[0]?.slice(0, 20) ?? "";
}

function gameplayKind(card: Card): GameplayCardKind {
  if (card.isCommander) return "commander";
  return card.gameplayKind ?? "combatant";
}

function snapshotCard(card: Card): DeckCardSnapshot {
  return {
    id: card.id,
    gameplayCardId: card.id,
    gameplayKind: gameplayKind(card),
    factionIds: card.factionIds ?? [],
    value: card.value,
    slug: card.slug,
    number: card.number,
    translations: Object.fromEntries(
      Object.entries(card.translations).map(([locale, translation]) => [
        locale,
        { name: translation.name },
      ]),
    ),
    artwork: card.artwork,
  };
}

function localizeCatalogCard(card: DeckCardSnapshot, locale: string): DeckCatalogCard {
  return { ...card, name: getLocalizedName(card.translations, locale) };
}

function localizeDisplayEntity(
  entity: NonNullable<Card["display"]>["season"] | NonNullable<Card["display"]>["set"] | undefined,
  locale: string,
) {
  return entity ? { id: entity.id, name: getLocalizedName(entity.translations, locale) } : null;
}

function catalogCard(card: Card, locale: string): DeckCatalogCard {
  return {
    ...localizeCatalogCard(snapshotCard(card), locale),
    description: getLocalizedDescription(card.translations, locale),
    attack: card.attack,
    defense: card.defense,
    season: localizeDisplayEntity(card.display?.season, locale),
    set: localizeDisplayEntity(card.display?.set, locale),
    rarity: card.display?.rarity
      ? {
          id: card.display.rarity.id,
          name: getLocalizedName(card.display.rarity.translations, locale),
          ...(card.display.rarity.visual?.color ? { color: card.display.rarity.visual.color } : {}),
        }
      : null,
    types: card.display?.types.map((type) => ({
      id: type.id,
      name: getLocalizedName(type.translations, locale),
      ...(type.visual?.color ? { color: type.visual.color } : {}),
    })) ?? [],
    relationIds: {
      seasonId: card.seasonId,
      setId: card.setId,
      rarityId: card.rarityId,
      typeIds: card.typeIds,
    },
  };
}

function fromSnapshot(document: FirebaseFirestore.DocumentSnapshot) {
  if (!document.exists) return null;
  return { id: document.id, ...document.data() } as DeckDocument;
}

function preview(deck: DeckDocument, locale: string): DeckPreviewView {
  return {
    id: deck.id,
    name: deck.name,
    description: deck.description,
    author: {
      username: deck.author.username,
      displayName: deck.author.displayName,
      ...(deck.author.avatarUrl ? { avatarUrl: deck.author.avatarUrl } : {}),
    },
    visibility: deck.visibility,
    status: deck.status,
    legalityStatus: deck.legality.status,
    cardCount: deck.stats.cardCount,
    uniqueCardCount: deck.stats.uniqueCardCount,
    factionIds: deck.factionIds,
    factions: (deck.factions ?? []).map((faction) => ({
      id: faction.id,
      name: getLocalizedName(faction.translations, locale),
      ...(faction.color ? { color: faction.color } : {}),
    })),
    ...(deck.preview.commanderTranslations || deck.preview.commanderName
      ? { commanderName: getLocalizedName(deck.preview.commanderTranslations, locale) || deck.preview.commanderName }
      : {}),
    ...(deck.preview.artworkUrl ? { artworkUrl: deck.preview.artworkUrl } : {}),
    artworkOrientation: deck.preview.artworkOrientation,
    updatedAtIso: deck.updatedAt.toDate().toISOString(),
    ...(deck.publishedAt
      ? { publishedAtIso: deck.publishedAt.toDate().toISOString() }
      : {}),
  };
}

export async function getBuilderCatalogPage({
  locale,
  cursor,
  commanderOnly = false,
  query = {},
}: {
  locale: string;
  cursor?: string;
  commanderOnly?: boolean;
  query?: DeckCatalogQuery;
}) {
  const repositoryFilters = commanderOnly
    ? { isCommander: true }
    : query.typeIds?.length === 1
      ? { typeId: query.typeIds[0] }
      : query.setId
        ? { setId: query.setId }
        : query.seasonId
          ? { seasonId: query.seasonId }
          : query.rarityIds?.length === 1
            ? { rarityId: query.rarityIds[0] }
            : { isCommander: false };
  const page = await cardsRepository.getPage({
    filters: repositoryFilters,
    sort: "number",
    cursor,
    limit: BUILDER_PAGE_SIZE,
  });
  const normalizedSearch = normalizeSearch(query.search ?? "");
  const items = page.items
    .map((card) => catalogCard(card, locale))
    .filter((card) => {
      if (commanderOnly) return card.gameplayKind === "commander";
      if (card.gameplayKind === "commander") return false;
      const attack = card.attack ?? 0;
      const defense = card.defense ?? 0;
      return (
        (!normalizedSearch || normalizeSearch(card.name).includes(normalizedSearch) || String(card.number).includes(normalizedSearch.replace(/^#/, ""))) &&
        (!query.factionIds?.length || query.factionIds.some((id) => card.factionIds.includes(id))) &&
        (!query.typeIds?.length || query.typeIds.some((id) => card.relationIds?.typeIds.includes(id))) &&
        (!query.rarityIds?.length || query.rarityIds.includes(card.relationIds?.rarityId ?? "")) &&
        (!query.seasonId || card.relationIds?.seasonId === query.seasonId) &&
        (!query.setId || card.relationIds?.setId === query.setId) &&
        (query.attackMin === undefined || attack >= query.attackMin) &&
        (query.attackMax === undefined || attack <= query.attackMax) &&
        (query.valueMin === undefined || card.value >= query.valueMin) &&
        (query.valueMax === undefined || card.value <= query.valueMax) &&
        (query.defenseMin === undefined || defense >= query.defenseMin) &&
        (query.defenseMax === undefined || defense <= query.defenseMax)
      );
    });
  const sort = query.sort ?? "number";
  items.sort((left, right) => {
    if (sort === "name") return left.name.localeCompare(right.name, locale);
    if (sort === "attack") return (right.attack ?? 0) - (left.attack ?? 0) || left.number - right.number;
    if (sort === "value") return right.value - left.value || left.number - right.number;
    if (sort === "defense") return (right.defense ?? 0) - (left.defense ?? 0) || left.number - right.number;
    return left.number - right.number;
  });
  return {
    items,
    nextCursor: page.nextCursor ?? undefined,
  };
}

export async function getDeckById(deckId: string) {
  const document = await getFirebaseAdminFirestore().collection("decks").doc(deckId).get();
  return fromSnapshot(document);
}

export async function getDeckDetail(
  deckId: string,
  locale: string,
  viewerId: string | null,
): Promise<DeckDetailView | null> {
  const deck = await getDeckById(deckId);
  if (!deck) return null;
  const isOwner = deck.authorId === viewerId;
  if (!isOwner && (deck.visibility === "private" || deck.status !== "published")) {
    return null;
  }
  return {
    ...preview(deck, locale),
    isOwner,
    entries: deck.entries.map((entry) => ({
      ...entry,
      card: {
        ...entry.card,
        name: getLocalizedName(entry.card.translations, locale),
      },
    })),
    commander: deck.commander
      ? {
          ...deck.commander,
          name: getLocalizedName(deck.commander.translations, locale),
        }
      : null,
    issues: deck.legality.issues,
    ruleset: deck.ruleset,
  };
}

export async function listDecks({
  locale,
  viewerId,
  scope,
  search,
  factionId,
  commander,
  sort,
  limit = DECK_PAGE_SIZE,
  cursor,
}: {
  locale: string;
  viewerId: string | null;
  scope: "community" | "mine";
  search?: string;
  factionId?: string;
  commander?: "yes" | "no";
  sort: DeckSort;
  limit?: number;
  cursor?: string;
}) {
  const firestore = getFirebaseAdminFirestore();
  let query: Query = firestore.collection("decks");
  if (scope === "mine") {
    if (!viewerId) return { items: [], nextCursor: undefined };
    query = query.where("authorId", "==", viewerId);
  } else {
    query = query
      .where("visibility", "==", "public")
      .where("status", "==", "published");
  }
  if (factionId) query = query.where("factionIds", "array-contains", factionId);
  if (search) {
    const token = searchQueryToken(search);
    if (token) query = query.where("searchTokens", "array-contains", token);
  }
  if (commander === "yes") query = query.where("hasCommander", "==", true);
  if (commander === "no") query = query.where("hasCommander", "==", false);
  const sortField = sort === "name" ? "nameNormalized" : sort === "updated" || scope === "mine" ? "updatedAt" : "publishedAt";
  const direction = sort === "name" ? "asc" : "desc";
  let decodedCursor: { value: string | number; id: string } | null = null;
  if (cursor) {
    try {
      const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as { value?: unknown; id?: unknown };
      if ((typeof parsed.value === "string" || typeof parsed.value === "number") && typeof parsed.id === "string") decodedCursor = { value: parsed.value, id: parsed.id };
    } catch {
      decodedCursor = null;
    }
  }
  try {
    query = query.orderBy(sortField, direction).orderBy(FieldPath.documentId(), direction);
    if (decodedCursor) {
      query = query.startAfter(
        typeof decodedCursor.value === "number" ? Timestamp.fromMillis(decodedCursor.value) : decodedCursor.value,
        decodedCursor.id,
      );
    }
    const snapshot = await query.limit(limit + 1).get();
    const documents = snapshot.docs.slice(0, limit);
    const lastDocument = documents.at(-1);
    const lastDeck = lastDocument ? fromSnapshot(lastDocument) : null;
    const cursorValue = lastDeck ? lastDeck[sortField as "nameNormalized" | "updatedAt" | "publishedAt"] : undefined;
    const nextCursor = snapshot.docs.length > limit && lastDeck && lastDocument && cursorValue
      ? Buffer.from(JSON.stringify({ value: typeof cursorValue === "string" ? cursorValue : cursorValue.toMillis(), id: lastDocument.id }), "utf8").toString("base64url")
      : undefined;
    return {
      items: documents.map(fromSnapshot).filter((deck): deck is DeckDocument => Boolean(deck)).map((deck) => preview(deck, locale)),
      nextCursor,
    };
  } catch (error) {
    if (!/requires an index|array-contains|inequality filter|failed_precondition/i.test(error instanceof Error ? error.message : "")) throw error;
    const snapshot = await firestore.collection("decks").orderBy(sortField, direction).limit(100).get();
    const items = snapshot.docs
      .map(fromSnapshot)
      .filter((deck): deck is DeckDocument => Boolean(deck))
      .filter((deck) =>
        (scope === "mine" ? deck.authorId === viewerId : deck.visibility === "public" && deck.status === "published") &&
        (!factionId || deck.factionIds.includes(factionId)) &&
        (!search || deck.searchTokens.includes(searchQueryToken(search))) &&
        (commander !== "yes" || Boolean(deck.commander)) &&
        (commander !== "no" || !deck.commander),
      )
      .slice(0, limit)
      .map((deck) => preview(deck, locale));
    return { items, nextCursor: undefined };
  }
}

export async function saveDeck({
  userId,
  draft,
  intent,
}: {
  userId: string;
  draft: DeckBuilderDraft;
  intent: "draft" | "publish";
}) {
  const profile = await ensurePublicProfileForUser(userId);
  if (!profile) throw new Error("PROFILE_REQUIRED");
  const existing = draft.deckId ? await getDeckById(draft.deckId) : null;
  if (draft.deckId && !existing) throw new Error("DECK_NOT_FOUND");
  if (existing && existing.authorId !== userId) throw new Error("FORBIDDEN");

  const uniqueCardIds = [
    ...new Set([
      ...draft.entries.map((entry) => entry.cardId),
      ...(draft.commanderId ? [draft.commanderId] : []),
    ]),
  ];
  const cards = await cardsRepository.getManyByIds(uniqueCardIds);
  if (cards.length !== uniqueCardIds.length) throw new Error("CARD_NOT_FOUND");
  const cardsById = new Map(cards.map((card) => [card.id, snapshotCard(card)]));
  const entries = draft.entries.map((entry) => ({
    ...entry,
    card: cardsById.get(entry.cardId)!,
  }));
  const commander = draft.commanderId ? cardsById.get(draft.commanderId) ?? null : null;
  const ruleResult = validateDeck({ entries, commander });
  if (intent === "publish" && !ruleResult.isLegal) throw new Error("DECK_NOT_LEGAL");

  const now = Timestamp.now();
  const status: DeckPublicationStatus = intent === "publish" ? "published" : "draft";
  const firstPublicPublish =
    status === "published" &&
    draft.visibility === "public" &&
    !existing?.firstPublishedAt;
  const cover = commander ?? entries[0]?.card;
  const name = draft.name.trim();
  const factionIds = [
    ...new Set([
      ...(commander?.factionIds ?? []),
      ...entries.flatMap((entry) => entry.card.factionIds),
    ]),
  ];
  const factionEntities = await factionsRepository.getManyByIds(factionIds);
  const factions = factionEntities.map((faction) => ({
    id: faction.id,
    slug: faction.slug,
    translations: Object.fromEntries(
      Object.entries(faction.translations).map(([locale, translation]) => [
        locale,
        { name: translation.name },
      ]),
    ),
    ...(faction.visual?.color ? { color: faction.visual.color } : {}),
  }));
  const reference = draft.deckId
    ? getFirebaseAdminFirestore().collection("decks").doc(draft.deckId)
    : getFirebaseAdminFirestore().collection("decks").doc();
  const data: Omit<DeckDocument, "id"> = {
    authorId: userId,
    author: {
      userId,
      username: profile.username,
      usernameNormalized: profile.usernameNormalized,
      displayName: profile.displayName,
      ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    },
    name,
    nameNormalized: normalizeSearch(name),
    searchTokens: searchTokens(name, profile.username, profile.displayName),
    slug: createSlug(name) || reference.id,
    description: draft.description.trim(),
    visibility: draft.visibility,
    status,
    entries,
    commander,
    hasCommander: Boolean(commander),
    factionIds,
    factions,
    ruleset: { id: SAFIR_STANDARD_RULESET.id, version: SAFIR_STANDARD_RULESET.version },
    legality: {
      status: ruleResult.status,
      isLegal: ruleResult.isLegal,
      issues: ruleResult.issues,
      errors: ruleResult.errors,
      warnings: ruleResult.warnings,
      checkedRulesetId: SAFIR_STANDARD_RULESET.id,
      checkedRulesetVersion: SAFIR_STANDARD_RULESET.version,
      checkedAt: now,
    },
    stats: {
      cardCount: ruleResult.cardCount,
      mainDeckCardCount: ruleResult.mainDeckCardCount,
      commanderCount: ruleResult.commanderCount,
      uniqueCardCount: entries.length,
      compatibleCombatantsCount: ruleResult.compatibleCombatantsCount,
      totalValue: ruleResult.totalValue,
      kindCounts: ruleResult.kindCounts,
      factionCounts: ruleResult.factionCounts,
    },
    preview: {
      ...(cover?.artwork.url ? { artworkUrl: cover.artwork.url } : {}),
      artworkOrientation: cover?.artwork.orientation ?? "vertical",
      ...(commander
        ? {
            commanderName: getLocalizedName(commander.translations, "fr"),
            commanderTranslations: commander.translations,
          }
        : {}),
    },
    ...(existing?.firstPublishedAt
      ? { firstPublishedAt: existing.firstPublishedAt }
      : firstPublicPublish
        ? { firstPublishedAt: now }
        : {}),
    ...(status === "published" ? { publishedAt: now } : {}),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const wasPublic = existing?.visibility === "public" && existing.status === "published";
  const isPublic = draft.visibility === "public" && status === "published";
  const deckCountDelta = Number(isPublic) - Number(wasPublic);
  const firestore = getFirebaseAdminFirestore();
  const batch = firestore.batch();
  batch.set(reference, data, { merge: false });
  if (deckCountDelta !== 0) {
    batch.update(firestore.collection("publicProfiles").doc(userId), {
      "stats.decksCount": FieldValue.increment(deckCountDelta),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  if (isPublic) {
    try {
      await recordDeckCreatedActivity(userId, {
      deckId: reference.id,
      deck: {
        name,
        slug: reference.id,
        ...(cover?.artwork.url
          ? {
              coverCard: {
                slug: cover.slug,
                translations: cover.translations,
                artworkUrl: cover.artwork.url,
              },
            }
          : {}),
        ...(commander?.artwork.url
          ? {
              commander: {
                slug: commander.slug,
                translations: commander.translations,
                artworkUrl: commander.artwork.url,
              },
            }
          : {}),
        cardCount: ruleResult.cardCount,
      },
      });
      if (!wasPublic && !firstPublicPublish) {
        await setDeckActivityPublished(userId, reference.id, true);
      }
    } catch (error) {
      console.error("[decks] Community activity synchronization failed", error);
    }
  } else if (existing?.firstPublishedAt) {
    try {
      await setDeckActivityPublished(userId, reference.id, false);
    } catch (error) {
      console.error("[decks] Community activity privacy update failed", error);
    }
  }
  return reference.id;
}

export async function deleteDeck(userId: string, deckId: string) {
  const deck = await getDeckById(deckId);
  if (deck && deck.authorId !== userId) throw new Error("FORBIDDEN");
  if (deck) {
    const firestore = getFirebaseAdminFirestore();
    const batch = firestore.batch();
    batch.delete(firestore.collection("decks").doc(deckId));
    if (deck.visibility === "public" && deck.status === "published") {
      batch.update(firestore.collection("publicProfiles").doc(userId), {
        "stats.decksCount": FieldValue.increment(-1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }
  await removeActivitiesForEntity(userId, `deck:${deckId}`);
}

export function deckToBuilderDraft(deck: DeckDocument): DeckBuilderDraft {
  return {
    deckId: deck.id,
    name: deck.name,
    description: deck.description,
    visibility: deck.visibility,
    commanderId: deck.commander?.id ?? null,
    entries: deck.entries.map(({ cardId, quantity }) => ({ cardId, quantity })),
  };
}

export function deckCardsForBuilder(deck: DeckDocument, locale: string) {
  return [
    ...deck.entries.map((entry) => localizeCatalogCard(entry.card, locale)),
    ...(deck.commander
      ? [localizeCatalogCard(deck.commander, locale)]
      : []),
  ];
}
