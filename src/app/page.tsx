import {
  MinimalHome,
  type MinimalHomeCopy,
} from "@/components/home/minimal-home";
import { mockCards } from "@/constants/mock-cards";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale, type AppLocale } from "@/lib/i18n/locales";

const homeCopy: Record<AppLocale, MinimalHomeCopy> = {
  fr: {
    eyebrow: "Le Codex officiel de Safir",
    title: "Safirdex",
    description:
      "Retrouvez une carte, une règle ou un fragment de l’univers Safir.",
    language: "Langue",
    signIn: "Connexion",
    account: "Mon espace",
    footer: "Safirdex",
    catalogue: "cartes dans le Codex",
    search: {
      placeholder: "Rechercher une carte…",
      searchLabel: "Rechercher dans le Codex",
      cards: "Cartes",
      decks: "Decks",
      community: "Communauté",
      results: "Cartes du Codex",
      noResults: "Aucune carte ne correspond à cette recherche.",
      clear: "Effacer la recherche",
      stats: { attack: "Attaque", value: "Valeur", defense: "Défense" },
    },
  },
  en: {
    eyebrow: "The official Safir Codex",
    title: "Safirdex",
    description:
      "Find a card, a rule, or a fragment from the world of Safir.",
    language: "Language",
    signIn: "Sign in",
    account: "My account",
    footer: "Safirdex",
    catalogue: "cards in the Codex",
    search: {
      placeholder: "Search for a card…",
      searchLabel: "Search the Codex",
      cards: "Cards",
      decks: "Decks",
      community: "Community",
      results: "Codex cards",
      noResults: "No cards match this search.",
      clear: "Clear search",
      stats: { attack: "Attack", value: "Value", defense: "Defense" },
    },
  },
};

interface HomePageProps {
  searchParams: Promise<{
    lang?: string | string[];
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [params, session] = await Promise.all([
    searchParams,
    getUserSession(),
  ]);
  const locale = resolveLocale(params.lang);

  return (
    <MinimalHome
      locale={locale}
      copy={homeCopy[locale]}
      cards={mockCards}
      signedIn={Boolean(session)}
    />
  );
}
