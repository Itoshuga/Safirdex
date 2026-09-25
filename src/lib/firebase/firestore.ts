import "server-only";

import type { FirestoreDataConverter } from "firebase-admin/firestore";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type { FirestoreCollectionName } from "@/lib/firebase/collections";

export function getAdminCollection(collectionName: FirestoreCollectionName) {
  return getFirebaseAdminFirestore().collection(collectionName);
}

export function getTypedAdminCollection<T>(
  collectionName: FirestoreCollectionName,
  converter: FirestoreDataConverter<T>,
) {
  return getAdminCollection(collectionName).withConverter(converter);
}
