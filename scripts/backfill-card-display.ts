import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const allowLiveProject = process.argv.includes("--allow-live");
  const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  if (!isEmulator && !allowLiveProject) {
    throw new Error(
      "Refusing to update a live Firebase project. Pass --allow-live explicitly.",
    );
  }

  const { syncAllCardDisplaySnapshots } = await import(
    "@/features/cards/server/display-snapshots"
  );
  const updated = await syncAllCardDisplaySnapshots();
  console.info(`Updated display snapshots for ${updated} card(s).`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
