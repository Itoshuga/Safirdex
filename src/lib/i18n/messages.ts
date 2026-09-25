import type { AppLocale } from "@/lib/i18n/locales";

export interface Messages {
  header: {
    codex: string;
    seasons: string;
    collection: string;
    signIn: string;
    signInSoon: string;
    language: string;
    menu: string;
    menuDescription: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    archiveLabel: string;
    curatedLabel: string;
  };
  cards: {
    eyebrow: string;
    title: string;
    description: string;
    browse: string;
    preview: string;
  };
  season: {
    eyebrow: string;
    title: string;
    description: string;
    cardCount: string;
    cta: string;
    artworkAlt: string;
  };
  collection: {
    badge: string;
    eyebrow: string;
    title: string;
    description: string;
    featureOne: string;
    featureTwo: string;
    featureThree: string;
  };
  footer: {
    description: string;
    legal: string;
    privacy: string;
    copyright: string;
  };
  stats: {
    attack: string;
    value: string;
    defense: string;
  };
}

export const messages: Record<AppLocale, Messages> = {
  en: {
    header: {
      codex: "Codex",
      seasons: "Seasons",
      collection: "Collection",
      signIn: "Sign in",
      signInSoon: "Sign in will be available soon",
      language: "Language",
      menu: "Navigation",
      menuDescription: "Explore Safir Codex",
    },
    hero: {
      eyebrow: "The official card archive",
      title: "Every card. Every story.",
      titleAccent: "One Codex.",
      description:
        "Explore the cards, seasons, rarities, and stories that shape the world of Safir — all gathered in one living archive.",
      primaryCta: "Explore the Codex",
      secondaryCta: "Latest season",
      archiveLabel: "Archive preview",
      curatedLabel: "Curated for players & collectors",
    },
    cards: {
      eyebrow: "Inside the archive",
      title: "Discover the cards",
      description:
        "A first glimpse at the creatures, relics, and forces waiting to be catalogued.",
      browse: "Browse all cards",
      preview: "Preview card",
    },
    season: {
      eyebrow: "Latest season",
      title: "Echoes of the Veil",
      description:
        "Ancient borders are thinning. Meet the guardians, wanderers, and forgotten powers emerging from beyond the Veil.",
      cardCount: "128 cards",
      cta: "Discover the season",
      artworkAlt: "Abstract artwork placeholder for Echoes of the Veil",
    },
    collection: {
      badge: "Coming soon",
      eyebrow: "Your cards, your journey",
      title: "Build your collection.",
      description:
        "Soon, Safir Codex will help you track every card you own and reveal what is still missing from your archive.",
      featureOne: "Track every card",
      featureTwo: "Find what is missing",
      featureThree: "Follow your progress",
    },
    footer: {
      description: "The official archive for the cards and world of Safir.",
      legal: "Legal",
      privacy: "Privacy",
      copyright: "Safir Codex. All rights reserved.",
    },
    stats: { attack: "Attack", value: "Value", defense: "Defense" },
  },
  fr: {
    header: {
      codex: "Codex",
      seasons: "Saisons",
      collection: "Collection",
      signIn: "Connexion",
      signInSoon: "La connexion sera bientôt disponible",
      language: "Langue",
      menu: "Navigation",
      menuDescription: "Explorer Safir Codex",
    },
    hero: {
      eyebrow: "Les archives officielles des cartes",
      title: "Chaque carte. Chaque histoire.",
      titleAccent: "Un seul Codex.",
      description:
        "Explorez les cartes, saisons, raretés et récits qui façonnent l’univers de Safir — réunis dans une archive vivante.",
      primaryCta: "Explorer le Codex",
      secondaryCta: "Dernière saison",
      archiveLabel: "Aperçu des archives",
      curatedLabel: "Pensé pour les joueurs et collectionneurs",
    },
    cards: {
      eyebrow: "Au cœur des archives",
      title: "Découvrez les cartes",
      description:
        "Un premier aperçu des créatures, reliques et forces qui rejoindront bientôt le Codex.",
      browse: "Voir toutes les cartes",
      preview: "Aperçu de la carte",
    },
    season: {
      eyebrow: "Dernière saison",
      title: "Les Échos du Voile",
      description:
        "Les frontières anciennes s’effacent. Découvrez les gardiens, voyageurs et puissances oubliées qui émergent au-delà du Voile.",
      cardCount: "128 cartes",
      cta: "Découvrir la saison",
      artworkAlt: "Visuel abstrait temporaire pour Les Échos du Voile",
    },
    collection: {
      badge: "Bientôt disponible",
      eyebrow: "Vos cartes, votre aventure",
      title: "Construisez votre collection.",
      description:
        "Bientôt, Safir Codex vous aidera à suivre chaque carte possédée et à découvrir celles qui manquent encore à vos archives.",
      featureOne: "Suivre chaque carte",
      featureTwo: "Identifier les manquantes",
      featureThree: "Mesurer votre progression",
    },
    footer: {
      description: "Les archives officielles des cartes et de l’univers Safir.",
      legal: "Mentions légales",
      privacy: "Confidentialité",
      copyright: "Safir Codex. Tous droits réservés.",
    },
    stats: { attack: "Attaque", value: "Valeur", defense: "Défense" },
  },
};
