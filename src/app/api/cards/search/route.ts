import { searchHomeCodexCards } from "@/features/cards/server/codex-service";
import { resolveLocale } from "@/lib/i18n/locales";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale") ?? undefined);
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 120);

  if (!query) {
    return Response.json([], {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  }

  try {
    const cards = await searchHomeCodexCards(locale, query);
    return Response.json(cards, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Home card search failed", error);
    return Response.json({ error: "SEARCH_UNAVAILABLE" }, { status: 500 });
  }
}

