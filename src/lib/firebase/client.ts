import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

import { getFirebaseClientConfig } from "@/lib/firebase/config";

let authEmulatorConnected = false;
let firestoreEmulatorConnected = false;
let storageEmulatorConnected = false;

const useFirebaseEmulators =
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

export function getFirebaseApp() {
  return getApps().length > 0
    ? getApp()
    : initializeApp(getFirebaseClientConfig());
}

export function getFirebaseAuth() {
  const auth = getAuth(getFirebaseApp());

  if (useFirebaseEmulators && !authEmulatorConnected) {
    connectAuthEmulator(
      auth,
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL ??
        "http://127.0.0.1:9099",
      { disableWarnings: true },
    );
    authEmulatorConnected = true;
  }

  return auth;
}

export function getFirebaseFirestore() {
  const firestore = getFirestore(getFirebaseApp());

  if (useFirebaseEmulators && !firestoreEmulatorConnected) {
    connectFirestoreEmulator(
      firestore,
      process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST ?? "127.0.0.1",
      Number(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT ?? 8080),
    );
    firestoreEmulatorConnected = true;
  }

  return firestore;
}

export function getFirebaseStorage() {
  const storage = getStorage(getFirebaseApp());

  if (useFirebaseEmulators && !storageEmulatorConnected) {
    connectStorageEmulator(
      storage,
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST ?? "127.0.0.1",
      Number(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_PORT ?? 9199),
    );
    storageEmulatorConnected = true;
  }

  return storage;
}
