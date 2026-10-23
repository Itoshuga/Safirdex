import { getCodexPage } from "@/features/cards/server/codex-service";
import { getCollectionEntriesForCards } from "@/features/collection/server/collection-service";
import { getUserSession } from "@/lib/auth/user-session";
import { resolveLocale } from "@/lib/i18n/locales";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams.get("locale") ?? undefined);
  const searchParams = Object.fromEntries(url.searchParams);
  delete searchParams.locale;

  try {
    const [data, session] = await Promise.all([
      getCodexPage(locale, searchParams),
      getUserSession(),
    ]);
    const collectionEntries = session
      ? await getCollectionEntriesForCards(
          session.uid,
          data.items.map((card) => card.id),
        )
      : null;

    return Response.json(
      {
        items: data.items,
        nextCursor: data.nextCursor,
        page: data.query.page,
        pageCount: data.pageCount,
        fetchedCount: data.fetchedCount,
        collectionEntries: collectionEntries
          ? [...collectionEntries.values()]
          : null,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Card catalogue page loading failed", error);
    return Response.json(
      { error: "CARD_PAGE_UNAVAILABLE" },
      { status: 500 },
    );
  }
}
