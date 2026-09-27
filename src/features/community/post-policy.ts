import type { CommunityPostVisibility } from "@/features/community/types";

export function canReadCommunityPost({
  authorId,
  viewerId,
  visibility,
  published,
  viewerFollowsAuthor,
}: {
  authorId: string;
  viewerId: string | null;
  visibility: CommunityPostVisibility;
  published: boolean;
  viewerFollowsAuthor: boolean;
}) {
  if (viewerId === authorId) return true;
  if (!published) return false;
  return visibility === "public" || (Boolean(viewerId) && viewerFollowsAuthor);
}

export function canDeleteCommunityPost(authorId: string, viewerId: string | null) {
  return Boolean(viewerId) && authorId === viewerId;
}

export function isShareableDeck(input: {
  authorId: string;
  viewerId: string;
  visibility: string;
  status: string;
}) {
  return input.authorId === input.viewerId && input.visibility === "public" && input.status === "published";
}

export function isShareableCollection(input: {
  ownerId: string;
  viewerId: string;
  publicProfile: boolean;
  collectionVisibility: string;
}) {
  return input.ownerId === input.viewerId && input.publicProfile && input.collectionVisibility === "public";
}
