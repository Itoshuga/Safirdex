import type { Timestamp } from "firebase-admin/firestore";

export interface FirestoreEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface StoredAsset {
  storagePath: string;
  url?: string;
}
