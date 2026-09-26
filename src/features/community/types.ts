import type { Timestamp } from "firebase-admin/firestore";

import type { Translations } from "@/types/translation";

export type ProfileSectionVisibility = "public" | "private";
export type CommunityActivityVisibility = "public" | "followers";
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
}

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
  actorId: string;
  actor: ActivityActorSnapshot;
  type: CommunityActivityType;
  visibility: CommunityActivityVisibility;
  published: boolean;
  entityKey: string;
  createdAt: Timestamp;
  payload: DeckActivityPayload | CollectionActivityPayload;
}

export interface CommunityActivityItem {
  id: string;
  actor: Omit<ActivityActorSnapshot, "userId">;
  type: CommunityActivityType;
  visibility: CommunityActivityVisibility;
  createdAtIso: string;
  payload:
    | DeckActivityPayload
    | (Omit<CollectionActivityPayload, "cards"> & {
        cards: Array<CollectionActivityCardSnapshot & { name: string }>;
      });
}

export interface CommunityFeedPage {
  items: CommunityActivityItem[];
  nextCursor?: string;
}

export interface ProfileDeckItem {
  id: string;
  name: string;
  slug: string;
  cardCount: number;
  commanderName?: string;
  artworkUrl?: string;
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
  | { tab: "overview" }
  | { tab: "decks"; items: ProfileDeckItem[]; private: boolean }
  | { tab: "collection"; items: ProfileCollectionItem[]; private: boolean }
  | { tab: "activity"; feed: CommunityFeedPage; private: boolean };
