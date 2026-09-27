import "server-only";

import { unstable_cache } from "next/cache";
import { Timestamp } from "firebase-admin/firestore";

import { canDeleteCommunityPost, canReadCommunityPost, isShareableCollection, isShareableDeck } from "@/features/community/post-policy";
import type {
  CommunityFeedDocument,
  CommunityPostAttachmentOption,
  CommunityPostAttachmentSnapshot,
  CommunityPostDocument,
  CommunityPostFeedDocument,
  CommunityPostView,
  PublicUserProfileDocument,
} from "@/features/community/types";
import type { DeckDocument } from "@/features/decks/types";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { firestoreDateIso } from "@/lib/firebase/timestamp";
import { getLocalizedName } from "@/lib/i18n/get-localized-value";
import type { AppLocale } from "@/lib/i18n/locales";
import { cardsRepository } from "@/repositories/cards.repository";
import { communityPostsRepository } from "@/repositories/community-posts.repository";
import { followsRepository } from "@/repositories/follows.repository";
import { publicProfilesRepository } from "@/repositories/public-profiles.repository";
import { createCommunityPostSchema, communityPostIdSchema, type CreateCommunityPostInput } from "@/validation/community-posts";

const MAX_BATCH_WRITES = 450;

async function writeInChunks(operations: Array<(batch: FirebaseFirestore.WriteBatch) => void>) {
  const firestore = getFirebaseAdminFirestore();
  for (let index = 0; index < operations.length; index += MAX_BATCH_WRITES) {
    const batch = firestore.batch();
    operations.slice(index, index + MAX_BATCH_WRITES).forEach((operation) => operation(batch));
    await batch.commit();
  }
}

async function recipientIds(authorId: string) {
  const followers = await getFirebaseAdminFirestore()
    .collection("users")
    .doc(authorId)
    .collection("followers")
    .select()
    .get();
  return new Set([authorId, ...followers.docs.map((document) => document.id)]);
}

function sourceData(post: CommunityPostDocument) {
  const { id, ...data } = post;
  void id;
  return data;
}

function feedDocument(post: CommunityPostDocument): CommunityPostFeedDocument {
  return {
    id: post.id,
    kind: "post",
    actorId: post.authorId,
    actor: post.author,
    visibility: post.visibility,
    published: post.published,
    entityKey: `post:${post.id}`,
    ...(post.attachmentKey ? { attachmentKey: post.attachmentKey } : {}),
    createdAt: post.createdAt,
    payload: {
      content: post.content,
      attachmentAvailable: post.attachmentAvailable,
      ...(post.attachment ? { attachment: post.attachment } : {}),
      ...(post.attachmentKey ? { attachmentKey: post.attachmentKey } : {}),
      updatedAt: post.updatedAt,
      stats: post.stats,
    },
  };
}

function feedData(post: CommunityPostDocument) {
  const { id, ...data } = feedDocument(post);
  void id;
  return data;
}

function postAttachmentView(
  post: Pick<CommunityPostDocument, "attachment" | "attachmentAvailable">,
  locale: AppLocale,
): CommunityPostView["attachment"] {
  const attachment = post.attachment;
  if (!attachment) return undefined;
  if (!post.attachmentAvailable) return { type: attachment.type, available: false };
  if (attachment.type === "card") {
    return {
      type: "card",
      available: true,
      cardId: attachment.cardId,
      slug: attachment.slug,
      number: attachment.number,
      name: getLocalizedName(attachment.translations, locale),
      ...(attachment.artworkUrl ? { artworkUrl: attachment.artworkUrl } : {}),
      orientation: attachment.orientation,
      ...(attachment.rarityTranslations ? { rarityName: getLocalizedName(attachment.rarityTranslations, locale) } : {}),
    };
  }
  if (attachment.type === "deck") {
    return {
      type: "deck",
      available: true,
      deckId: attachment.deckId,
      name: attachment.name,
      ...(attachment.artworkUrl ? { artworkUrl: attachment.artworkUrl } : {}),
      artworkOrientation: attachment.artworkOrientation,
      ...((attachment.commanderTranslations || attachment.commanderName)
        ? { commanderName: getLocalizedName(attachment.commanderTranslations, locale) || attachment.commanderName }
        : {}),
      cardCount: attachment.cardCount,
    };
  }
  return {
    type: "collection",
    available: true,
    ownerId: attachment.ownerId,
    cardCount: attachment.cardCount,
    cards: attachment.cards.map((card) => ({
      ...card,
      name: getLocalizedName(card.translations, locale),
    })),
  };
}

export function mapCommunityPost(
  post: CommunityPostDocument,
  locale: AppLocale,
  viewerId: string | null,
): CommunityPostView {
  return {
    id: post.id,
    author: post.author,
    content: post.content,
    visibility: post.visibility,
    createdAtIso: firestoreDateIso(post.createdAt),
    updatedAtIso: firestoreDateIso(post.updatedAt),
    isOwner: post.authorId === viewerId,
    ...(postAttachmentView(post, locale) ? { attachment: postAttachmentView(post, locale) } : {}),
  };
}

export function mapPostFeedDocument(
  document: Extract<CommunityFeedDocument, { kind: "post" }>,
  locale: AppLocale,
  viewerId: string | null,
) {
  return mapCommunityPost({
    id: document.id,
    authorId: document.actorId,
    author: document.actor,
    visibility: document.visibility,
    published: document.published,
    createdAt: document.createdAt,
    ...document.payload,
  }, locale, viewerId);
}

async function resolveAttachment(
  userId: string,
  input: NonNullable<CreateCommunityPostInput["attachment"]>,
): Promise<{ attachment: CommunityPostAttachmentSnapshot; attachmentKey: string }> {
  if (input.type === "card") {
    const card = await cardsRepository.getById(input.id);
    if (!card) throw new Error("ATTACHMENT_NOT_FOUND");
    return {
      attachmentKey: `card:${card.id}`,
      attachment: {
        type: "card",
        cardId: card.id,
        slug: card.slug,
        number: card.number,
        translations: card.translations,
        ...(card.artwork.url ? { artworkUrl: card.artwork.url } : {}),
        orientation: card.artwork.orientation,
        ...(card.display?.rarity ? { rarityTranslations: card.display.rarity.translations } : {}),
      },
    };
  }
  if (input.type === "deck") {
    const snapshot = await getFirebaseAdminFirestore().collection("decks").doc(input.id).get();
    const deck = snapshot.exists ? ({ id: snapshot.id, ...snapshot.data() } as DeckDocument) : null;
    if (!deck || !isShareableDeck({ ...deck, viewerId: userId })) throw new Error("ATTACHMENT_FORBIDDEN");
    return {
      attachmentKey: `deck:${deck.id}`,
      attachment: {
        type: "deck",
        deckId: deck.id,
        authorId: deck.authorId,
        name: deck.name,
        ...(deck.preview.artworkUrl ? { artworkUrl: deck.preview.artworkUrl } : {}),
        artworkOrientation: deck.preview.artworkOrientation,
        ...(deck.preview.commanderTranslations ? { commanderTranslations: deck.preview.commanderTranslations } : {}),
        ...(deck.preview.commanderName ? { commanderName: deck.preview.commanderName } : {}),
        cardCount: deck.stats.cardCount,
      },
    };
  }
  const profile = await publicProfilesRepository.getById(userId);
  if (!profile || !isShareableCollection({
    ownerId: userId,
    viewerId: userId,
    publicProfile: profile.visibility.publicProfile,
    collectionVisibility: profile.visibility.collection,
  })) throw new Error("ATTACHMENT_FORBIDDEN");
  const collection = await getFirebaseAdminFirestore()
    .collection("users").doc(userId).collection("collection")
    .orderBy("updatedAt", "desc").limit(4).get();
  const cards = await cardsRepository.getManyByIds(collection.docs.map((document) => document.id));
  return {
    attachmentKey: `collection:${userId}`,
    attachment: {
      type: "collection",
      ownerId: userId,
      cardCount: profile.stats.collectionCardsCount,
      cards: cards.map((card) => ({
        cardId: card.id,
        slug: card.slug,
        translations: card.translations,
        ...(card.artwork.url ? { artworkUrl: card.artwork.url } : {}),
      })),
    },
  };
}

export async function createCommunityPost(userId: string, input: unknown, locale: AppLocale) {
  const data = createCommunityPostSchema.parse(input);
  const profile = await publicProfilesRepository.getById(userId);
  if (!profile || !profile.visibility.publicProfile) throw new Error("PROFILE_REQUIRED");
  const resolved = data.attachment ? await resolveAttachment(userId, data.attachment) : null;
  const firestore = getFirebaseAdminFirestore();
  const reference = communityPostsRepository.collection().doc();
  const now = Timestamp.now();
  const post: CommunityPostDocument = {
    id: reference.id,
    authorId: userId,
    author: {
      userId,
      username: profile.username,
      displayName: profile.displayName,
      ...(profile.avatarUrl ? { avatarUrl: profile.avatarUrl } : {}),
    },
    content: data.content,
    visibility: data.visibility,
    published: true,
    ...(resolved ? resolved : {}),
    attachmentAvailable: true,
    createdAt: now,
    updatedAt: now,
    stats: { likesCount: 0, commentsCount: 0 },
  };
  const recipients = await recipientIds(userId);
  const readReference = firestore.collection("communityActivities").doc(post.id);
  const readData = feedData(post);
  await writeInChunks([
    (batch) => batch.create(reference, sourceData(post)),
    (batch) => batch.create(readReference, readData),
    ...[...recipients].map((recipientId) => (batch: FirebaseFirestore.WriteBatch) => batch.set(
      firestore.collection("userFeeds").doc(recipientId).collection("items").doc(post.id),
      readData,
    )),
  ]);
  return mapCommunityPost(post, locale, userId);
}

export async function getCommunityPost(postIdValue: string, locale: AppLocale, viewerId: string | null) {
  const postId = communityPostIdSchema.parse(postIdValue);
  const post = await communityPostsRepository.getById(postId);
  if (!post) return null;
  const follows = Boolean(viewerId && viewerId !== post.authorId && await followsRepository.isFollowing(viewerId, post.authorId));
  if (!canReadCommunityPost({
    authorId: post.authorId,
    viewerId,
    visibility: post.visibility,
    published: post.published,
    viewerFollowsAuthor: follows,
  })) return null;
  return mapCommunityPost(post, locale, viewerId);
}

export async function deleteCommunityPost(userId: string, postIdValue: string) {
  const postId = communityPostIdSchema.parse(postIdValue);
  const post = await communityPostsRepository.getById(postId);
  if (!post) return false;
  if (!canDeleteCommunityPost(post.authorId, userId)) throw new Error("FORBIDDEN");
  const firestore = getFirebaseAdminFirestore();
  const recipients = await recipientIds(post.authorId);
  await writeInChunks([
    (batch) => batch.delete(communityPostsRepository.reference(post.id)),
    (batch) => batch.delete(firestore.collection("communityActivities").doc(post.id)),
    ...[...recipients].map((recipientId) => (batch: FirebaseFirestore.WriteBatch) => batch.delete(
      firestore.collection("userFeeds").doc(recipientId).collection("items").doc(post.id),
    )),
  ]);
  return true;
}

export async function setPostAttachmentAvailability(attachmentKey: string, available: boolean) {
  const posts = await communityPostsRepository.byAttachmentKey(attachmentKey);
  if (!posts.length) return;
  const firestore = getFirebaseAdminFirestore();
  const operations: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];
  for (const post of posts) {
    const recipients = await recipientIds(post.authorId);
    const updatedAt = Timestamp.now();
    operations.push(
      (batch) => batch.update(communityPostsRepository.reference(post.id), { attachmentAvailable: available, updatedAt }),
      (batch) => batch.update(firestore.collection("communityActivities").doc(post.id), {
        "payload.attachmentAvailable": available,
        "payload.updatedAt": updatedAt,
      }),
      ...[...recipients].map((recipientId) => (batch: FirebaseFirestore.WriteBatch) => batch.set(
        firestore.collection("userFeeds").doc(recipientId).collection("items").doc(post.id),
        { "payload.attachmentAvailable": available, "payload.updatedAt": updatedAt },
        { merge: true },
      )),
    );
  }
  await writeInChunks(operations);
}

export async function setActorPostsPublished(profile: PublicUserProfileDocument) {
  const posts = await communityPostsRepository.byAuthor(profile.id);
  if (!posts.length) return;
  const firestore = getFirebaseAdminFirestore();
  const recipients = await recipientIds(profile.id);
  const published = profile.visibility.publicProfile;
  const operations: Array<(batch: FirebaseFirestore.WriteBatch) => void> = [];
  for (const post of posts) {
    operations.push(
      (batch) => batch.update(communityPostsRepository.reference(post.id), { published }),
      (batch) => batch.update(firestore.collection("communityActivities").doc(post.id), { published }),
      ...[...recipients].map((recipientId) => (batch: FirebaseFirestore.WriteBatch) => batch.set(
        firestore.collection("userFeeds").doc(recipientId).collection("items").doc(post.id),
        { published },
        { merge: true },
      )),
    );
  }
  await writeInChunks(operations);
}

export async function searchCommunityPostCards(locale: AppLocale, query: string) {
  const options = await unstable_cache(async () => {
    const cards = await cardsRepository.getAll();
    return cards.map((card) => ({
      type: "card" as const,
      id: card.id,
      slug: card.slug,
      number: card.number,
      name: getLocalizedName(card.translations, locale),
      ...(card.artwork.url ? { artworkUrl: card.artwork.url } : {}),
      orientation: card.artwork.orientation,
    }));
  }, ["community-post-card-options-v1", locale], { revalidate: 3600 })();
  const normalized = query.trim().toLocaleLowerCase(locale);
  return options
    .filter((card) => !normalized || card.name.toLocaleLowerCase(locale).includes(normalized) || String(card.number).includes(normalized))
    .slice(0, 12);
}

export async function getCommunityPostDeckOptions(userId: string, locale: AppLocale) {
  const snapshot = await getFirebaseAdminFirestore().collection("decks")
    .where("authorId", "==", userId)
    .where("visibility", "==", "public")
    .where("status", "==", "published")
    .orderBy("updatedAt", "desc")
    .limit(20)
    .get();
  return snapshot.docs.map((document): CommunityPostAttachmentOption => {
    const deck = { id: document.id, ...document.data() } as DeckDocument;
    return {
      type: "deck",
      id: deck.id,
      name: deck.name,
      ...(deck.preview.artworkUrl ? { artworkUrl: deck.preview.artworkUrl } : {}),
      artworkOrientation: deck.preview.artworkOrientation,
      ...((deck.preview.commanderTranslations || deck.preview.commanderName)
        ? { commanderName: getLocalizedName(deck.preview.commanderTranslations, locale) || deck.preview.commanderName }
        : {}),
      cardCount: deck.stats.cardCount,
    };
  });
}

export async function getCommunityPostCollectionOption(userId: string, locale: AppLocale) {
  const profile = await publicProfilesRepository.getById(userId);
  if (!profile || !isShareableCollection({
    ownerId: userId,
    viewerId: userId,
    publicProfile: profile.visibility.publicProfile,
    collectionVisibility: profile.visibility.collection,
  })) return null;
  const collection = await getFirebaseAdminFirestore().collection("users").doc(userId)
    .collection("collection").orderBy("updatedAt", "desc").limit(4).get();
  const cards = await cardsRepository.getManyByIds(collection.docs.map((document) => document.id));
  return {
    type: "collection" as const,
    id: "self" as const,
    cardCount: profile.stats.collectionCardsCount,
    cards: cards.map((card) => ({
      cardId: card.id,
      name: getLocalizedName(card.translations, locale),
      ...(card.artwork.url ? { artworkUrl: card.artwork.url } : {}),
    })),
  };
}
