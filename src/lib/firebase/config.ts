export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

const requiredClientKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
] as const;

export function getFirebaseClientConfig() {
  const missingKeys = requiredClientKeys.filter(
    (key) => !firebaseConfig[key],
  );

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing Firebase client configuration: ${missingKeys.join(", ")}`,
    );
  }

  return firebaseConfig as Record<(typeof requiredClientKeys)[number], string>;
}
