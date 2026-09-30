export type ModeratedUserRole = "user" | "admin";

export interface AdminUserListItem {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  disabled: boolean;
  username: string | null;
  displayName: string;
  avatarUrl?: string;
  role: ModeratedUserRole;
  onboardingCompleted: boolean;
  collectionCardsCount: number;
  createdAtIso: string | null;
  lastSignInAtIso: string | null;
}

export interface AdminUsersPageData {
  items: AdminUserListItem[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  truncated: boolean;
}

export interface AdminUserCollectionItem {
  cardId: string;
  number: number | null;
  name: string;
  seasonName: string | null;
  artworkUrl?: string;
  ownedQuantity: number;
  duplicateQuantity: number;
  tradeQuantity: number;
}

export interface AdminUserDetail {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  disabled: boolean;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  role: ModeratedUserRole;
  roles: string[];
  onboardingCompleted: boolean;
  preferredLocale: string | null;
  createdAtIso: string | null;
  lastSignInAtIso: string | null;
  providers: string[];
  supportsPassword: boolean;
  isCurrentUser: boolean;
  profileStats: {
    followersCount: number;
    followingCount: number;
    decksCount: number;
  };
  visibility: {
    publicProfile: boolean;
    decks: "public" | "private";
    collection: "public" | "private";
    activity: "public" | "private";
  } | null;
  collection: {
    items: AdminUserCollectionItem[];
    uniqueOwnedCards: number;
    totalOwnedCopies: number;
    duplicateCopies: number;
    tradeCopies: number;
    completionPercentage: number;
  };
}
