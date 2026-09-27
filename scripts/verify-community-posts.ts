import assert from "node:assert/strict";

import {
  canDeleteCommunityPost,
  canReadCommunityPost,
  isShareableCollection,
  isShareableDeck,
} from "../src/features/community/post-policy.ts";
import { COMMUNITY_POST_MAX_LENGTH, createCommunityPostSchema } from "../src/validation/community-posts.ts";

assert.equal(createCommunityPostSchema.safeParse({ content: "Bonjour", visibility: "public" }).success, true);
assert.equal(createCommunityPostSchema.safeParse({ content: "", visibility: "public" }).success, false);
assert.equal(createCommunityPostSchema.safeParse({ content: "", visibility: "followers", attachment: { type: "card", id: "card-1" } }).success, true);
assert.equal(createCommunityPostSchema.safeParse({ content: "Deck", visibility: "public", attachment: { type: "deck", id: "deck-1" } }).success, true);
assert.equal(createCommunityPostSchema.safeParse({ content: "Collection", visibility: "public", attachment: { type: "collection", id: "self" } }).success, true);
assert.equal(createCommunityPostSchema.safeParse({ content: "x".repeat(COMMUNITY_POST_MAX_LENGTH + 1), visibility: "public" }).success, false);

assert.equal(canReadCommunityPost({ authorId: "a", viewerId: null, visibility: "public", published: true, viewerFollowsAuthor: false }), true);
assert.equal(canReadCommunityPost({ authorId: "a", viewerId: "b", visibility: "followers", published: true, viewerFollowsAuthor: true }), true);
assert.equal(canReadCommunityPost({ authorId: "a", viewerId: "b", visibility: "followers", published: true, viewerFollowsAuthor: false }), false);
assert.equal(canReadCommunityPost({ authorId: "a", viewerId: "a", visibility: "followers", published: false, viewerFollowsAuthor: false }), true);
assert.equal(canDeleteCommunityPost("a", "a"), true);
assert.equal(canDeleteCommunityPost("a", "b"), false);

assert.equal(isShareableDeck({ authorId: "a", viewerId: "a", visibility: "public", status: "published" }), true);
assert.equal(isShareableDeck({ authorId: "a", viewerId: "a", visibility: "private", status: "published" }), false);
assert.equal(isShareableDeck({ authorId: "a", viewerId: "b", visibility: "public", status: "published" }), false);
assert.equal(isShareableCollection({ ownerId: "a", viewerId: "a", publicProfile: true, collectionVisibility: "public" }), true);
assert.equal(isShareableCollection({ ownerId: "a", viewerId: "a", publicProfile: true, collectionVisibility: "private" }), false);

console.info("Community post validation and access policies are valid.");
