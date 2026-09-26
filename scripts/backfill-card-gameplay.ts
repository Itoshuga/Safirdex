import { getFirebaseAdminFirestore } from "../src/lib/firebase/admin";

async function main() {
  const apply = process.argv.includes("--apply");
  const firestore = getFirebaseAdminFirestore();
  const snapshot = await firestore.collection("cards").get();
  const candidates = snapshot.docs.filter(
    (document) => !document.get("gameplayKind") || !Array.isArray(document.get("factionIds")),
  );

  console.log(`${candidates.length} card(s) require gameplay classification backfill.`);
  if (!apply || candidates.length === 0) {
    console.log(apply ? "Nothing to update." : "Dry run only. Pass --apply to write changes.");
    return;
  }

  for (let index = 0; index < candidates.length; index += 450) {
    const batch = firestore.batch();
    for (const document of candidates.slice(index, index + 450)) {
      batch.update(document.ref, {
        gameplayKind: document.get("isCommander") === true ? "commander" : "combatant",
        factionIds: Array.isArray(document.get("factionIds")) ? document.get("factionIds") : [],
      });
    }
    await batch.commit();
  }
  console.log("Gameplay classification backfill complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
