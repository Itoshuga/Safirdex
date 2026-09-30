"use server";

import { revalidatePath, updateTag } from "next/cache";
import { after } from "next/server";

import {
  collectionAdjustmentSchema,
  collectionQuantitySchema,
  tradeAdjustmentSchema,
  tradePrivacySettingsSchema,
  tradeQuantitySchema,
} from "@/features/collection/schema";
import {
  CollectionServiceError,
  mutateCollectionEntry,
  updateTradePrivacySettings,
} from "@/features/collection/server/collection-service";
import type {
  CollectionActionCode,
  CollectionActionResult,
} from "@/features/collection/types";
import { recordCollectionUpdatedActivity } from "@/features/community/server/activity-service";
import type { CollectionActivityPayload } from "@/features/community/types";
import { COMMUNITY_CACHE_TAGS } from "@/features/community/server/cache-tags";
import {
  assertApplicationAvailable,
  MAINTENANCE_UNAVAILABLE_CODE,
} from "@/features/maintenance/server/maintenance-service";
import { getUserSession } from "@/lib/auth/user-session";

function invalidateCollectionPages() {
  updateTag(COMMUNITY_CACHE_TAGS.profiles);
  revalidatePath("/[locale]/collection", "page");
  revalidatePath("/[locale]/cards", "page");
  revalidatePath("/[locale]/cards/[slug]", "page");
  revalidatePath("/[locale]/account", "page");
  revalidatePath("/[locale]/user/[username]", "page");
}

function scheduleCollectionSideEffects(
  userId: string,
  activityPayload: CollectionActivityPayload | null,
) {
  after(async () => {
    try {
      invalidateCollectionPages();
    } catch (error) {
      console.error("[Collection] Unable to invalidate collection pages.", error);
    }
    if (!activityPayload) return;
    await recordCollectionUpdatedActivity(userId, activityPayload).catch((error) => {
      console.error("[Collection] Unable to publish the collection activity.", error);
    });
  });
}

function actionError(error: unknown): CollectionActionCode {
  if (error instanceof CollectionServiceError) return error.code;
  return "COLLECTION_UPDATE_FAILED";
}

async function authorizeMutation(): Promise<
  | { ok: true; userId: string }
  | { ok: false; code: "AUTH_REQUIRED" | "APPLICATION_MAINTENANCE" }
> {
  const session = await getUserSession();
  if (!session) return { ok: false as const, code: "AUTH_REQUIRED" as const };
  try {
    await assertApplicationAvailable({ session });
    return { ok: true as const, userId: session.uid };
  } catch {
    return { ok: false as const, code: MAINTENANCE_UNAVAILABLE_CODE };
  }
}

async function runEntryMutation(
  input: unknown,
  mode: "set-owned" | "adjust-owned" | "set-trade" | "adjust-trade",
): Promise<CollectionActionResult> {
  const authorization = await authorizeMutation();
  if (!authorization.ok) return authorization;
  const schema = mode === "set-owned"
    ? collectionQuantitySchema
    : mode === "adjust-owned"
      ? collectionAdjustmentSchema
      : mode === "set-trade"
        ? tradeQuantitySchema
        : tradeAdjustmentSchema;
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_COLLECTION_INPUT" };
  }
  try {
    const { activityPayload, ...result } = await mutateCollectionEntry(
      authorization.userId,
      parsed.data.cardId,
      "quantity" in parsed.data
        ? { kind: mode as "set-owned" | "set-trade", quantity: parsed.data.quantity }
        : { kind: mode as "adjust-owned" | "adjust-trade", delta: parsed.data.delta },
    );
    scheduleCollectionSideEffects(authorization.userId, activityPayload);
    return { ok: true, ...result };
  } catch (error) {
    return { ok: false, code: actionError(error) };
  }
}

export async function setOwnedQuantityAction(input: {
  cardId: string;
  quantity: number;
}) {
  return runEntryMutation(input, "set-owned");
}

export async function adjustOwnedQuantityAction(input: {
  cardId: string;
  delta: -1 | 1;
}) {
  return runEntryMutation(input, "adjust-owned");
}

export async function setTradeQuantityAction(input: {
  cardId: string;
  quantity: number;
}) {
  return runEntryMutation(input, "set-trade");
}

export async function adjustTradeQuantityAction(input: {
  cardId: string;
  delta: -1 | 1;
}) {
  return runEntryMutation(input, "adjust-trade");
}

export async function updateTradeSettingsAction(input: {
  showTradesPublicly: boolean;
  showDiscordForTrades: boolean;
  discord: string;
}) {
  const authorization = await authorizeMutation();
  if (!authorization.ok) return authorization;
  const parsed = tradePrivacySettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, code: "INVALID_COLLECTION_INPUT" as const };
  }
  try {
    const settings = await updateTradePrivacySettings(
      authorization.userId,
      parsed.data,
    );
    invalidateCollectionPages();
    return { ok: true as const, settings };
  } catch {
    return { ok: false as const, code: "COLLECTION_UPDATE_FAILED" as const };
  }
}
