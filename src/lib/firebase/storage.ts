import { getDownloadURL, ref } from "firebase/storage";

import { getFirebaseStorage } from "@/lib/firebase/client";
import { storagePathSchema } from "@/validation/shared";

/**
 * Resolves a Firebase Storage download URL on demand. The storage path remains
 * the canonical reference persisted in Firestore; a URL may expire or change.
 */
export async function getStorageDownloadUrl(storagePath: string) {
  const validStoragePath = storagePathSchema.parse(storagePath);

  return getDownloadURL(ref(getFirebaseStorage(), validStoragePath));
}
