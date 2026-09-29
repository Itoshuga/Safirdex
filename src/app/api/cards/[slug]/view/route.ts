import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/collections";
import { cardsRepository } from "@/repositories/cards.repository";
import { slugSchema } from "@/validation/shared";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const parsedSlug = slugSchema.safeParse((await params).slug);
  if (!parsedSlug.success) {
    return Response.json({ error: "INVALID_CARD" }, { status: 400 });
  }

  try {
    const card = await cardsRepository.getBySlug(parsedSlug.data);
    if (!card) {
      return Response.json({ error: "CARD_NOT_FOUND" }, { status: 404 });
    }

    await getFirebaseAdminFirestore()
      .collection(FIRESTORE_COLLECTIONS.cardViews)
      .doc(card.id)
      .set(
        {
          cardId: card.id,
          slug: card.slug,
          count: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Card view tracking failed", error);
    return Response.json({ error: "TRACKING_UNAVAILABLE" }, { status: 500 });
  }
}

