import { loadEnvConfig } from "@next/env";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import {
  FieldValue,
  getFirestore,
  Timestamp,
  type DocumentData,
  type DocumentReference,
} from "firebase-admin/firestore";

import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { storagePaths } from "@/lib/firebase/storage-paths";
import type { CreateCardSetInput } from "@/types/card-set";
import type { CreateCardTypeInput } from "@/types/card-type";
import type { CreateCardInput } from "@/types/card";
import type { CreateGlossaryEntryInput } from "@/types/glossary";
import type { CreateRarityInput } from "@/types/rarity";
import type { CreateSeasonInput } from "@/types/season";
import type { CreateFactionInput } from "@/types/faction";
import {
  createCardSchema,
  createCardSetSchema,
  createCardTypeSchema,
  createGlossaryEntrySchema,
  createRaritySchema,
  createSeasonSchema,
  createFactionSchema,
} from "@/validation/schemas";

loadEnvConfig(process.cwd());

const isDryRun = process.argv.includes("--dry-run");
const allowLiveProject = process.argv.includes("--allow-live");
const isEmulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

const releaseDate = Timestamp.fromDate(new Date("2026-01-15T00:00:00.000Z"));

const seasonDefinition = {
  slug: "season-1",
  number: 1,
  translations: {
    fr: {
      name: "Saison 1",
      description: "La première saison fictive utilisée pour le développement.",
    },
    en: {
      name: "Season 1",
      description: "The first fictional season used for development.",
    },
  },
  releaseDate,
  isActive: true,
  isFeatured: true,
} satisfies Omit<CreateSeasonInput, "artwork">;

const setDefinition = {
  slug: "base-set",
  code: "S1-BASE",
  translations: {
    fr: { name: "Édition de base", description: "Première édition de test." },
    en: { name: "Base Set", description: "First development set." },
  },
  releaseDate,
} satisfies Omit<CreateCardSetInput, "seasonId">;

const rarityDefinitions = [
  {
    slug: "common",
    order: 0,
    visual: { color: "#9AA4A6" },
    translations: { fr: { name: "Commune" }, en: { name: "Common" } },
  },
  {
    slug: "rare",
    order: 1,
    visual: { color: "#5E9CAE" },
    translations: { fr: { name: "Rare" }, en: { name: "Rare" } },
  },
  {
    slug: "epic",
    order: 2,
    visual: { color: "#8C6BA8" },
    translations: { fr: { name: "Épique" }, en: { name: "Epic" } },
  },
  {
    slug: "legendary",
    order: 3,
    visual: { color: "#C39A58" },
    translations: {
      fr: { name: "Légendaire" },
      en: { name: "Legendary" },
    },
  },
] satisfies CreateRarityInput[];

const typeDefinitions = [
  {
    slug: "warrior",
    translations: { fr: { name: "Guerrier" }, en: { name: "Warrior" } },
  },
  {
    slug: "mage",
    translations: { fr: { name: "Mage" }, en: { name: "Mage" } },
  },
  {
    slug: "beast",
    translations: { fr: { name: "Bête" }, en: { name: "Beast" } },
  },
  {
    slug: "artifact",
    translations: { fr: { name: "Artefact" }, en: { name: "Artifact" } },
  },
] satisfies CreateCardTypeInput[];

const factionDefinitions = [
  {
    slug: "neutral",
    visual: { color: "#4D8FA8" },
    translations: {
      fr: { name: "Neutre", description: "Faction commune des données de développement." },
      en: { name: "Neutral", description: "Shared faction for development data." },
    },
  },
] satisfies CreateFactionInput[];

const glossaryDefinitions = [
  {
    key: "silence",
    slug: "silence",
    translations: {
      fr: { label: "Silence", definition: "Désactive les capacités ciblées." },
      en: { label: "Silence", definition: "Disables the targeted abilities." },
    },
  },
  {
    key: "move",
    slug: "move",
    translations: {
      fr: { label: "Déplacer", definition: "Change une carte de zone." },
      en: { label: "Move", definition: "Moves a card to another zone." },
    },
  },
  {
    key: "on-play",
    slug: "on-play",
    translations: {
      fr: {
        label: "En jeu",
        definition: "Se déclenche lorsque la carte entre en jeu.",
      },
      en: {
        label: "On play",
        definition: "Triggers when the card enters play.",
      },
    },
  },
] satisfies CreateGlossaryEntryInput[];

interface SeedReferences {
  seasonId: string;
  setId: string;
  rarityIds: Record<string, string>;
  typeIds: Record<string, string>;
  factionIds: Record<string, string>;
}

interface CardDefinition {
  number: number;
  slug: string;
  rarity: string;
  types: string[];
  attack: number;
  value: number;
  defense: number;
  isCommander?: boolean;
  isPromo?: boolean;
  isFeatured?: boolean;
  withoutSet?: boolean;
  translations: CreateCardInput["translations"];
  alternativeArtwork?: boolean;
}

const cardDefinitions: CardDefinition[] = [
  {
    number: 1,
    slug: "gardienne-du-voile",
    rarity: "legendary",
    types: ["warrior", "mage"],
    attack: 7,
    value: 4,
    defense: 8,
    isCommander: true,
    isFeatured: true,
    translations: {
      fr: {
        name: "Gardienne du Voile",
        description: "[[glossary:on-play]] : applique [[glossary:silence]].",
      },
      en: {
        name: "Veil Warden",
        description: "[[glossary:on-play]]: apply [[glossary:silence]].",
      },
    },
  },
  {
    number: 2,
    slug: "eclat-lumineux",
    rarity: "rare",
    types: ["artifact"],
    attack: 2,
    value: 9,
    defense: 3,
    isPromo: true,
    isFeatured: true,
    alternativeArtwork: true,
    withoutSet: true,
    translations: {
      fr: {
        name: "Éclat Lumineux",
        description: "[[glossary:move]] une carte alliée.",
      },
      en: {
        name: "Luminous Shard",
        description: "[[glossary:move]] an allied card.",
      },
    },
  },
  {
    number: 3,
    slug: "colosse-sylvestre",
    rarity: "epic",
    types: ["beast", "warrior"],
    attack: 8,
    value: 3,
    defense: 9,
    isFeatured: true,
    translations: {
      fr: { name: "Colosse Sylvestre", description: "Une montagne en marche." },
      en: { name: "Mossbound Colossus", description: "A mountain on the move." },
    },
  },
  {
    number: 4,
    slug: "cartographe-astrale",
    rarity: "epic",
    types: ["mage"],
    attack: 5,
    value: 8,
    defense: 4,
    isFeatured: true,
    translations: {
      fr: { name: "Cartographe Astrale", description: "Trace les voies célestes." },
      en: { name: "Astral Cartographer", description: "Charts celestial paths." },
    },
  },
  {
    number: 5,
    slug: "sentinelle-de-cendre",
    rarity: "common",
    types: ["warrior"],
    attack: 4,
    value: 2,
    defense: 6,
    translations: {
      fr: { name: "Sentinelle de Cendre", description: "Elle veille sans repos." },
      en: { name: "Ash Sentinel", description: "It watches without rest." },
    },
  },
  {
    number: 6,
    slug: "chimere-des-brumes",
    rarity: "rare",
    types: ["beast", "mage"],
    attack: 6,
    value: 5,
    defense: 5,
    translations: {
      fr: { name: "Chimère des Brumes", description: "Sa forme change avec le vent." },
      en: { name: "Mist Chimera", description: "Its shape changes with the wind." },
    },
  },
  {
    number: 7,
    slug: "relique-du-premier-ciel",
    rarity: "legendary",
    types: ["artifact"],
    attack: 0,
    value: 9,
    defense: 7,
    translations: {
      fr: { name: "Relique du Premier Ciel", description: "Un fragment d'avant l'aube." },
      en: { name: "Relic of the First Sky", description: "A fragment from before dawn." },
    },
  },
  {
    number: 8,
    slug: "emissaire-du-seuil",
    rarity: "common",
    types: ["warrior"],
    attack: 3,
    value: 6,
    defense: 3,
    isPromo: true,
    withoutSet: true,
    translations: {
      fr: { name: "Émissaire du Seuil", description: "Porte la parole des frontières." },
      en: { name: "Threshold Envoy", description: "Carries word from the borders." },
    },
  },
];

function buildCardInput(
  definition: CardDefinition,
  cardId: string,
  references: SeedReferences,
): CreateCardInput {
  const rarity = rarityDefinitions.find(
    (entry) => entry.slug === definition.rarity,
  );
  const types = definition.types.map((slug) => {
    const type = typeDefinitions.find((entry) => entry.slug === slug);
    if (!type) throw new Error(`Unknown seed card type: ${slug}`);
    return type;
  });
  if (!rarity) throw new Error(`Unknown seed rarity: ${definition.rarity}`);

  return {
    number: definition.number,
    slug: definition.slug,
    seasonId: references.seasonId,
    setId: definition.withoutSet ? null : references.setId,
    rarityId: references.rarityIds[definition.rarity],
    typeIds: definition.types.map((type) => references.typeIds[type]),
    gameplayKind: definition.isCommander ? "commander" : "combatant",
    factionIds: [references.factionIds.neutral],
    attack: definition.attack,
    value: definition.value,
    defense: definition.defense,
    isCommander: definition.isCommander ?? false,
    isPromo: definition.isPromo ?? false,
    isFeatured: definition.isFeatured ?? false,
    translations: definition.translations,
    artwork: {
      id: "main",
      storagePath: storagePaths.cardMainArtwork(cardId),
      orientation: "vertical",
      isPrimary: true,
      translations: {
        fr: { alt: `Artwork temporaire de ${definition.translations.fr.name}` },
        en: { alt: `Placeholder artwork for ${definition.translations.en.name}` },
      },
    },
    alternativeArtworks: definition.alternativeArtwork
      ? [
          {
            id: "alt-01",
            storagePath: storagePaths.cardAlternativeArtwork(cardId, "alt-01"),
            orientation: "horizontal",
            translations: {
              fr: { name: "Variation horizontale" },
              en: { name: "Horizontal variation" },
            },
          },
        ]
      : [],
    display: {
      season: {
        id: references.seasonId,
        slug: seasonDefinition.slug,
        translations: Object.fromEntries(
          Object.entries(seasonDefinition.translations).map(
            ([locale, translation]) => [locale, { name: translation.name }],
          ),
        ),
      },
      ...(definition.withoutSet
        ? {}
        : {
            set: {
              id: references.setId,
              slug: setDefinition.slug,
              translations: Object.fromEntries(
                Object.entries(setDefinition.translations).map(
                  ([locale, translation]) => [locale, { name: translation.name }],
                ),
              ),
            },
          }),
      rarity: {
        id: references.rarityIds[rarity.slug],
        slug: rarity.slug,
        order: rarity.order,
        visual: { color: rarity.visual.color },
        translations: Object.fromEntries(
          Object.entries(rarity.translations).map(([locale, translation]) => [
            locale,
            { name: translation.name },
          ]),
        ),
      },
      types: types.map((type) => ({
        id: references.typeIds[type.slug],
        slug: type.slug,
        translations: Object.fromEntries(
          Object.entries(type.translations).map(([locale, translation]) => [
            locale,
            { name: translation.name },
          ]),
        ),
      })),
    },
  };
}

function initializeSeedApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
    "safirtcg";

  if (isEmulator) {
    return initializeApp({ projectId });
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  return initializeApp({
    projectId,
    credential:
      clientEmail && privateKey
        ? cert({ projectId, clientEmail, privateKey })
        : applicationDefault(),
  });
}

async function resolveReference(
  collectionName: string,
  uniqueField: string,
  uniqueValue: string,
): Promise<{ reference: DocumentReference; exists: boolean }> {
  const collection = getFirestore().collection(collectionName);
  const snapshot = await collection
    .where(uniqueField, "==", uniqueValue)
    .limit(1)
    .get();
  const existingDocument = snapshot.docs[0];

  return existingDocument
    ? { reference: existingDocument.ref, exists: true }
    : { reference: collection.doc(), exists: false };
}

async function writeSeedDocument(
  reference: DocumentReference,
  exists: boolean,
  data: DocumentData,
) {
  await reference.set(
    {
      ...data,
      ...(exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

function validateSeedDefinitions() {
  const fakeReferences: SeedReferences = {
    seasonId: "seed-season",
    setId: "seed-set",
    rarityIds: Object.fromEntries(
      rarityDefinitions.map(({ slug }) => [slug, `seed-${slug}`]),
    ),
    typeIds: Object.fromEntries(
      typeDefinitions.map(({ slug }) => [slug, `seed-${slug}`]),
    ),
    factionIds: Object.fromEntries(
      factionDefinitions.map(({ slug }) => [slug, `seed-${slug}`]),
    ),
  };

  createSeasonSchema.parse({
    ...seasonDefinition,
    artwork: { storagePath: storagePaths.seasonCover(fakeReferences.seasonId) },
  });
  createCardSetSchema.parse({
    ...setDefinition,
    seasonId: fakeReferences.seasonId,
  });
  rarityDefinitions.forEach((rarity) => createRaritySchema.parse(rarity));
  typeDefinitions.forEach((type) => createCardTypeSchema.parse(type));
  factionDefinitions.forEach((faction) => createFactionSchema.parse(faction));
  glossaryDefinitions.forEach((entry) =>
    createGlossaryEntrySchema.parse(entry),
  );
  cardDefinitions.forEach((card, index) =>
    createCardSchema.parse(
      buildCardInput(card, `seed-card-${index + 1}`, fakeReferences),
    ),
  );
}

async function seed() {
  validateSeedDefinitions();

  if (isDryRun) {
    console.info(
      `Seed valid: 1 season, 1 set, ${rarityDefinitions.length} rarities, ${typeDefinitions.length} card types, ${factionDefinitions.length} factions, ${glossaryDefinitions.length} glossary entries, and ${cardDefinitions.length} cards.`,
    );
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("The development seed cannot run with NODE_ENV=production.");
  }

  if (!isEmulator && !allowLiveProject) {
    throw new Error(
      "Refusing to seed a live Firebase project. Use the emulator or pass --allow-live explicitly.",
    );
  }

  initializeSeedApp();

  const seasonTarget = await resolveReference(
    FIRESTORE_COLLECTIONS.seasons,
    "slug",
    seasonDefinition.slug,
  );
  const season = createSeasonSchema.parse({
    ...seasonDefinition,
    artwork: {
      storagePath: storagePaths.seasonCover(seasonTarget.reference.id),
    },
  });
  await writeSeedDocument(seasonTarget.reference, seasonTarget.exists, season);

  const setTarget = await resolveReference(
    FIRESTORE_COLLECTIONS.sets,
    "slug",
    setDefinition.slug,
  );
  const cardSet = createCardSetSchema.parse({
    ...setDefinition,
    seasonId: seasonTarget.reference.id,
  });
  await writeSeedDocument(setTarget.reference, setTarget.exists, cardSet);

  const rarityIds: Record<string, string> = {};
  for (const rarityDefinition of rarityDefinitions) {
    const target = await resolveReference(
      FIRESTORE_COLLECTIONS.rarities,
      "slug",
      rarityDefinition.slug,
    );
    const rarity = createRaritySchema.parse({
      ...rarityDefinition,
      visual: {
        ...rarityDefinition.visual,
        iconStoragePath: storagePaths.rarityIcon(target.reference.id),
      },
    });
    await writeSeedDocument(target.reference, target.exists, rarity);
    rarityIds[rarity.slug] = target.reference.id;
  }

  const typeIds: Record<string, string> = {};
  for (const typeDefinition of typeDefinitions) {
    const target = await resolveReference(
      FIRESTORE_COLLECTIONS.cardTypes,
      "slug",
      typeDefinition.slug,
    );
    const cardType = createCardTypeSchema.parse({
      ...typeDefinition,
      visual: {
        iconStoragePath: storagePaths.cardTypeIcon(target.reference.id),
      },
    });
    await writeSeedDocument(target.reference, target.exists, cardType);
    typeIds[cardType.slug] = target.reference.id;
  }

  const factionIds: Record<string, string> = {};
  for (const factionDefinition of factionDefinitions) {
    const target = await resolveReference(
      FIRESTORE_COLLECTIONS.factions,
      "slug",
      factionDefinition.slug,
    );
    const faction = createFactionSchema.parse({
      ...factionDefinition,
      visual: {
        ...factionDefinition.visual,
        iconStoragePath: storagePaths.factionIcon(target.reference.id),
      },
    });
    await writeSeedDocument(target.reference, target.exists, faction);
    factionIds[faction.slug] = target.reference.id;
  }

  for (const glossaryDefinition of glossaryDefinitions) {
    const target = await resolveReference(
      FIRESTORE_COLLECTIONS.glossaryEntries,
      "key",
      glossaryDefinition.key,
    );
    const entry = createGlossaryEntrySchema.parse(glossaryDefinition);
    await writeSeedDocument(target.reference, target.exists, entry);
  }

  const references: SeedReferences = {
    seasonId: seasonTarget.reference.id,
    setId: setTarget.reference.id,
    rarityIds,
    typeIds,
    factionIds,
  };

  for (const cardDefinition of cardDefinitions) {
    const target = await resolveReference(
      FIRESTORE_COLLECTIONS.cards,
      "slug",
      cardDefinition.slug,
    );
    const card = createCardSchema.parse(
      buildCardInput(cardDefinition, target.reference.id, references),
    );
    await writeSeedDocument(target.reference, target.exists, card);
  }

  console.info("Safir Codex development seed completed successfully.");
}

seed().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
