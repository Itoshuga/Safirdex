import type { Timestamp } from "firebase-admin/firestore";

import type { DeckPreviewView } from "@/features/decks/types";
import type { Translations } from "@/types/translation";

export type ProfileSectionVisibility = "public" | "private";
export type CommunityActivityVisibility = "public" | "followers";
export type CommunityPostVisibility = CommunityActivityVisibility;
export type CommunityPostAttachmentType = "card" | "deck" | "collection";
export type CommunityActivityType =
  | "deck_created"
  | "deck_updated"
  | "collection_updated";

export interface PublicProfileStats {
  followersCount: number;
  followingCount: number;
  decksCount: number;
  collectionCardsCount: number;
}

export interface PublicProfileVisibility {
  publicProfile: boolean;
  decks: ProfileSectionVisibility;
  collection: ProfileSectionVisibility;
  activity: ProfileSectionVisibility;
}

export interface PublicUserProfileDocument {
  id: string;
  username: string;
  usernameNormalized: string;
  displayName: string;
  displayNameNormalized: string;
  avatarUrl?: string;
  avatarStoragePath?: string;
  bannerUrl?: string;
  bannerStoragePath?: string;
  bio?: string;
  joinedAt: Timestamp;
  updatedAt: Timestamp;
  stats: PublicProfileStats;
  visibility: PublicProfileVisibility;
}

export interface PublicProfileView {
  username: string;
  displayName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  joinedAtIso: string;
  stats: PublicProfileStats;
  visibility: PublicProfileVisibility;
}

export interface ProfileViewerState {
  signedIn: boolean;
  isOwner: boolean;
  isFollowing: boolean;
}

export interface CommunityUserResult extends PublicProfileView {
  isFollowing: boolean;
  isSelf: boolean;
}

export type CommunityDeckItem = Pick<
  DeckPreviewView,
  | "id"
  | "name"
  | "description"
  | "author"
  | "cardCount"
  | "factions"
  | "commanderName"
  | "artworkUrl"
  | "artworkOrientation"
  | "publishedAtIso"
>;

export interface CommunityConnectionItem {
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  followersCount: number;
  isFollowing: boolean;
  isSelf: boolean;
}

export interface ActivityActorSnapshot {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface DeckActivityPayload {
  deckId: string;
  deck: {
    name: string;
    slug: string;
    coverCard?: {
      slug: string;
      translations: Translations<{ name: string }>;
      artworkUrl: string;
    };
    commander?: {
      slug: string;
      translations: Translations<{ name: string }>;
      artworkUrl: string;
    };
    factions?: Array<{
      id: string;
      translations: Translations<{ name: string }>;
      color?: string;
    }>;
    cardCount: number;
  };
}

export interface CollectionActivityCardSnapshot {
  cardId: string;
  slug: string;
  translations: Translations<{ name: string }>;
  artworkUrl?: string;
}

export interface CollectionActivityPayload {
  addedCount: number;
  cards: CollectionActivityCardSnapshot[];
}

export interface CommunityActivityDocument {
  id: string;
  kind?: "activity";
  actorId: string;
  actor: ActivityActorSnapshot;
  type: CommunityActivityType;
  visibility: CommunityActivityVisibility;
  published: boolean;
  entityKey: string;
  createdAt: Timestamp;
  payload: DeckActivityPayload | CollectionActivityPayload;
}

export interface CommunityPostCardSnapshot {
  type: "card";
  cardId: string;
  slug: string;
  number: number;
  translations: Translations<{ name: string }>;
  artworkUrl?: string;
  orientation: "vertical" | "horizontal";
  rarityTranslations?: Translations<{ name: string }>;
}

export interface CommunityPostDeckSnapshot {
  type: "deck";
  deckId: string;
  authorId: string;
  name: string;
  artworkUrl?: string;
  artworkOrientation: "vertical" | "horizontal";
  commanderTranslations?: Translations<{ name: string }>;
  commanderName?: string;
  cardCount: number;
}

export interface CommunityPostCollectionSnapshot {
  type: "collection";
  ownerId: string;
  cardCount: number;
  cards: CollectionActivityCardSnapshot[];
}

export type CommunityPostAttachmentSnapshot =
  | CommunityPostCardSnapshot
  | CommunityPostDeckSnapshot
  | CommunityPostCollectionSnapshot;

export interface CommunityPostDocument {
  id: string;
  authorId: string;
  author: ActivityActorSnapshot;
  content: string;
  visibility: CommunityPostVisibility;
  published: boolean;
  attachmentKey?: string;
  attachmentAvailable: boolean;
  attachment?: CommunityPostAttachmentSnapshot;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stats: { likesCount: number; commentsCount: number };
}

export interface CommunityPostFeedDocument {
  id: string;
  kind: "post";
  actorId: string;
  actor: ActivityActorSnapshot;
  visibility: CommunityPostVisibility;
  published: boolean;
  entityKey: string;
  attachmentKey?: string;
  createdAt: Timestamp;
  payload: Omit<CommunityPostDocument, "id" | "authorId" | "author" | "visibility" | "published" | "createdAt">;
}

export type CommunityFeedDocument = CommunityActivityDocument | CommunityPostFeedDocument;

export interface CommunityActivityItem {
  id: string;
  actor: ActivityActorSnapshot;
  type: CommunityActivityType;
  visibility: CommunityActivityVisibility;
  createdAtIso: string;
  payload:
    | DeckActivityPayload
    | (Omit<CollectionActivityPayload, "cards"> & {
        cards: Array<CollectionActivityCardSnapshot & { name: string }>;
      });
}

export type CommunityPostAttachmentView =
  | { type: CommunityPostAttachmentType; available: false }
  | ({ type: "card"; available: true; cardId: string; slug: string; number: number; name: string; artworkUrl?: string; orientation: "vertical" | "horizontal"; rarityName?: string })
  | ({ type: "deck"; available: true; deckId: string; name: string; artworkUrl?: string; artworkOrientation: "vertical" | "horizontal"; commanderName?: string; cardCount: number })
  | ({ type: "collection"; available: true; ownerId: string; cardCount: number; cards: Array<CollectionActivityCardSnapshot & { name: string }> });

export interface CommunityPostView {
  id: string;
  author: ActivityActorSnapshot;
  content: string;
  visibility: CommunityPostVisibility;
  createdAtIso: string;
  updatedAtIso: string;
  isOwner: boolean;
  attachment?: CommunityPostAttachmentView;
}

export type CommunityFeedItem =
  | { id: string; kind: "activity"; activity: CommunityActivityItem }
  | { id: string; kind: "post"; post: CommunityPostView };

export interface CommunityFeedPage {
  items: CommunityFeedItem[];
  nextCursor?: string;
}

export interface CommunityPostCardOption {
  type: "card";
  id: string;
  slug: string;
  number: number;
  name: string;
  artworkUrl?: string;
  orientation: "vertical" | "horizontal";
}

export interface CommunityPostDeckOption {
  type: "deck";
  id: string;
  name: string;
  artworkUrl?: string;
  artworkOrientation: "vertical" | "horizontal";
  commanderName?: string;
  cardCount: number;
}

export interface CommunityPostCollectionOption {
  type: "collection";
  id: "self";
  cardCount: number;
  cards: Array<{ cardId: string; name: string; artworkUrl?: string }>;
}

export type CommunityPostAttachmentOption =
  | CommunityPostCardOption
  | CommunityPostDeckOption
  | CommunityPostCollectionOption;

export interface ProfileDeckItem {
  id: string;
  name: string;
  slug: string;
  cardCount: number;
  commanderName?: string;
  artworkUrl?: string;
  status?: "draft" | "published";
  visibility?: "private" | "unlisted" | "public";
}

export interface ProfileCollectionItem {
  cardId: string;
  slug: string;
  name: string;
  artworkUrl?: string;
  orientation: "vertical" | "horizontal";
  quantity: number;
}

export type ProfileTab = "overview" | "decks" | "collection" | "activity";

export type ProfileTabContent =
  | {
      tab: "overview";
      decks: ProfileDeckItem[];
      decksPrivate: boolean;
      collectionCount: number;
      collectionPrivate: boolean;
      feed: CommunityFeedPage;
      activityPrivate: boolean;
    }
  | { tab: "decks"; items: ProfileDeckItem[]; private: boolean }
  | { tab: "collection"; items: ProfileCollectionItem[]; private: boolean }
  | { tab: "activity"; feed: CommunityFeedPage; private: boolean };
