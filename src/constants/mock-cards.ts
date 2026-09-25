import type { CardPreviewData } from "@/types/card";

export const mockCards: CardPreviewData[] = [
  {
    id: "veil-warden",
    number: 17,
    seasonId: "echoes-of-the-veil",
    rarityId: "mythic",
    typeIds: ["guardian", "spirit"],
    attack: 7,
    value: 4,
    defense: 8,
    isCommander: false,
    isPromo: false,
    artwork: {
      url: "/artwork/veil-warden.svg",
      orientation: "vertical",
      alt: {
        en: "Abstract artwork placeholder for Veil Warden",
        fr: "Visuel abstrait temporaire pour Gardienne du Voile",
      },
    },
    translations: {
      en: {
        name: "Veil Warden",
        description: "A silent guardian at the edge of the known world.",
      },
      fr: {
        name: "Gardienne du Voile",
        description: "Une gardienne silencieuse aux confins du monde connu.",
      },
    },
    rarity: { en: "Mythic", fr: "Mythique" },
    types: {
      en: ["Guardian", "Spirit"],
      fr: ["Gardien", "Esprit"],
    },
  },
  {
    id: "luminous-shard",
    number: 42,
    seasonId: "echoes-of-the-veil",
    rarityId: "rare",
    typeIds: ["relic"],
    attack: 2,
    value: 9,
    defense: 3,
    isCommander: false,
    isPromo: false,
    artwork: {
      url: "/artwork/luminous-shard.svg",
      orientation: "vertical",
      alt: {
        en: "Abstract artwork placeholder for Luminous Shard",
        fr: "Visuel abstrait temporaire pour Éclat Lumineux",
      },
    },
    translations: {
      en: {
        name: "Luminous Shard",
        description: "Its facets hold the memory of a forgotten sky.",
      },
      fr: {
        name: "Éclat Lumineux",
        description: "Ses facettes abritent le souvenir d’un ciel oublié.",
      },
    },
    rarity: { en: "Rare", fr: "Rare" },
    types: { en: ["Relic"], fr: ["Relique"] },
  },
  {
    id: "mossbound-colossus",
    number: 63,
    seasonId: "echoes-of-the-veil",
    rarityId: "uncommon",
    typeIds: ["ancient", "nature"],
    attack: 8,
    value: 3,
    defense: 9,
    isCommander: true,
    isPromo: false,
    artwork: {
      url: "/artwork/mossbound-colossus.svg",
      orientation: "vertical",
      alt: {
        en: "Abstract artwork placeholder for Mossbound Colossus",
        fr: "Visuel abstrait temporaire pour Colosse Sylvestre",
      },
    },
    translations: {
      en: {
        name: "Mossbound Colossus",
        description: "A mountain that chose to walk again.",
      },
      fr: {
        name: "Colosse Sylvestre",
        description: "Une montagne qui choisit de marcher à nouveau.",
      },
    },
    rarity: { en: "Uncommon", fr: "Peu commune" },
    types: {
      en: ["Ancient", "Nature"],
      fr: ["Ancien", "Nature"],
    },
  },
  {
    id: "astral-cartographer",
    number: 88,
    seasonId: "echoes-of-the-veil",
    rarityId: "epic",
    typeIds: ["wanderer"],
    attack: 5,
    value: 8,
    defense: 4,
    isCommander: false,
    isPromo: true,
    artwork: {
      url: "/artwork/astral-cartographer.svg",
      orientation: "vertical",
      alt: {
        en: "Abstract artwork placeholder for Astral Cartographer",
        fr: "Visuel abstrait temporaire pour Cartographe Astrale",
      },
    },
    translations: {
      en: {
        name: "Astral Cartographer",
        description: "She maps paths that exist only between dreams.",
      },
      fr: {
        name: "Cartographe Astrale",
        description: "Elle trace les chemins qui n’existent qu’entre les rêves.",
      },
    },
    rarity: { en: "Epic", fr: "Épique" },
    types: { en: ["Wanderer"], fr: ["Voyageur"] },
  },
];
