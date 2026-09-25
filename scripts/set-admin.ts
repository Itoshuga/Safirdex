import { loadEnvConfig } from "@next/env";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

loadEnvConfig(process.cwd());

function getScriptAuth() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const useEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
  const credential = useEmulator
    ? undefined
    : projectId && clientEmail && privateKey
      ? cert({ projectId, clientEmail, privateKey })
      : applicationDefault();
  const app = getApps()[0] ?? initializeApp({
    ...(credential ? { credential } : {}),
    projectId: projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
  return getAuth(app);
}

function getArgument(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

async function main() {
  const uidArgument = getArgument("uid");
  const emailArgument = getArgument("email");

  if (!uidArgument && !emailArgument) {
    throw new Error("Provide --uid=<firebase-uid> or --email=<account-email>.");
  }

  const auth = getScriptAuth();
  const user = uidArgument
    ? await auth.getUser(uidArgument)
    : await auth.getUserByEmail(emailArgument!);
  const roles = Array.from(
    new Set([
      "user",
      ...(Array.isArray(user.customClaims?.roles)
        ? user.customClaims.roles.filter(
            (role): role is string => typeof role === "string",
          )
        : []),
      "admin",
    ]),
  );

  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims ?? {}),
    admin: true,
    role: "admin",
    roles,
  });

  await getFirestore().collection("users").doc(user.uid).set(
    {
      role: "admin",
      roles,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  console.info(`Administrator claim granted to ${user.email ?? user.uid}.`);
  console.info("The user must sign in again to refresh their token.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
