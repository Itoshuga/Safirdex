import "server-only";

import type { CommunityPostDocument } from "@/features/community/types";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";

export const communityPostsRepository = {
  collection() {
    return getFirebaseAdminFirestore().collection("communityPosts");
  },

  reference(postId: string) {
    return this.collection().doc(postId);
  },

  async getById(postId: string) {
    const snapshot = await this.reference(postId).get();
    return snapshot.exists
      ? ({ id: snapshot.id, ...snapshot.data() } as CommunityPostDocument)
      : null;
  },

  async byAttachmentKey(attachmentKey: string) {
    const snapshot = await this.collection().where("attachmentKey", "==", attachmentKey).get();
    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })) as CommunityPostDocument[];
  },

  async byAuthor(authorId: string) {
    const snapshot = await this.collection().where("authorId", "==", authorId).get();
    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })) as CommunityPostDocument[];
  },
};
