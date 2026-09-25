import assert from "node:assert/strict";

import {
  extractGlossaryReferences,
  getGlossaryKeys,
  tokenizeGlossaryContent,
} from "@/lib/glossary/references";
import { getTranslation } from "@/lib/i18n/get-localized-value";
import { createSlug, createUniqueSlug } from "@/lib/utils/slug";
import { cardStatSchema } from "@/validation/schemas";

function verifyTranslations() {
  const translations = {
    fr: { name: "Gardienne" },
    en: { name: "Warden" },
  };

  assert.equal(getTranslation(translations, "fr-CA")?.name, "Gardienne");
  assert.equal(getTranslation(translations, "de")?.name, "Warden");
  assert.equal(getTranslation({ ja: { name: "守護者" } }, "de")?.name, "守護者");
  assert.equal(getTranslation({}, "fr"), undefined);
}

function verifyStats() {
  assert.equal(cardStatSchema.parse(0), 0);
  assert.equal(cardStatSchema.parse(9), 9);
  assert.equal(cardStatSchema.safeParse(-1).success, false);
  assert.equal(cardStatSchema.safeParse(10).success, false);
  assert.equal(cardStatSchema.safeParse(2.5).success, false);
}

async function verifySlugs() {
  assert.equal(createSlug("  Éclat d’Azur  "), "eclat-dazur");
  assert.equal(
    await createUniqueSlug(
      "Éclat d’Azur",
      (slug) => slug === "eclat-dazur" || slug === "eclat-dazur-2",
    ),
    "eclat-dazur-3",
  );
}

function verifyGlossaryReferences() {
  const content =
    "[[glossary:on-play]] : [[glossary:move]], puis [[glossary:silence]].";
  const references = extractGlossaryReferences(content);

  assert.deepEqual(
    references.map(({ key }) => key),
    ["on-play", "move", "silence"],
  );
  assert.deepEqual(getGlossaryKeys(`${content} [[glossary:move]]`), [
    "on-play",
    "move",
    "silence",
  ]);
  assert.equal(
    tokenizeGlossaryContent(content).filter(({ type }) => type === "glossary")
      .length,
    3,
  );
}

async function main() {
  verifyTranslations();
  verifyStats();
  await verifySlugs();
  verifyGlossaryReferences();
  console.info("Domain checks passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
