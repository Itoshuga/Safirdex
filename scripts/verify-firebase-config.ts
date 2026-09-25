import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const publicCollections = [
  "cards",
  "seasons",
  "sets",
  "rarities",
  "cardTypes",
  "glossaryEntries",
];

const publicStorageRoots = ["cards", "seasons", "rarities", "card-types"];

async function main() {
  const [firebaseConfig, indexes, firestoreRules, storageRules] =
    await Promise.all([
      readFile("firebase.json", "utf8"),
      readFile("firestore.indexes.json", "utf8"),
      readFile("firestore.rules", "utf8"),
      readFile("storage.rules", "utf8"),
    ]);

  JSON.parse(firebaseConfig);
  JSON.parse(indexes);

  assert.doesNotMatch(firestoreRules, /allow\s+write\s*:\s*if\s+true/);
  assert.doesNotMatch(firestoreRules, /allow\s+read\s*,\s*write\s*:\s*if\s+true/);
  assert.doesNotMatch(storageRules, /allow\s+write\s*:\s*if\s+true/);
  assert.doesNotMatch(storageRules, /allow\s+read\s*,\s*write\s*:\s*if\s+true/);

  for (const collection of publicCollections) {
    assert.match(firestoreRules, new RegExp(`match /${collection}/\\{`));
  }

  for (const root of publicStorageRoots) {
    assert.match(storageRules, new RegExp(`match /${root}/\\{`));
  }

  assert.match(firestoreRules, /match \/\{document=\*\*\}/);
  assert.match(storageRules, /match \/\{allPaths=\*\*\}/);

  console.info("Firebase configuration checks passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
