import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { Timestamp } from "firebase-admin/firestore";
import { unstable_cache } from "next/cache";

import { hasAdminClaim } from "@/lib/auth/claims";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import type {
  MaintenanceConfig,
  MaintenanceTranslation,
  MaintenanceUpdateInput,
} from "@/features/maintenance/types";

export const MAINTENANCE_CACHE_TAG = "application:maintenance";
export const MAINTENANCE_UNAVAILABLE_CODE = "APPLICATION_MAINTENANCE";

const COLLECTION = "appConfig";
const DOCUMENT = "maintenance";
const CACHE_SCOPE = process.env.FIRESTORE_EMULATOR_HOST
  ? "emulator"
  : process.env.FIREBASE_ADMIN_PROJECT_ID ?? "default";

export const DEFAULT_MAINTENANCE_TRANSLATIONS = {
  fr: {
    title: "Maintenance en cours",
    message:
      "Safir Codex est temporairement indisponible pendant une mise à jour.",
  },
  en: {
    title: "Maintenance in progress",
    message:
      "Safir Codex is temporarily unavailable while we perform an update.",
  },
} satisfies Record<"fr" | "en", MaintenanceTranslation>;

export const DEFAULT_MAINTENANCE_CONFIG: MaintenanceConfig = {
  enabled: false,
  mode: "normal",
  translations: DEFAULT_MAINTENANCE_TRANSLATIONS,
  estimatedEndAtIso: null,
  showEstimatedEnd: false,
  updatedAtIso: null,
  updatedBy: null,
  updatedByLabel: null,
  enabledAtIso: null,
  enabledBy: null,
  enabledByLabel: null,
};

function timestampIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return null;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function translation(
  value: unknown,
  fallback: MaintenanceTranslation,
): MaintenanceTranslation {
  const candidate = value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
  return {
    title: text(candidate.title) ?? fallback.title,
    message: text(candidate.message) ?? fallback.message,
  };
}

function toMaintenanceConfig(data: Record<string, unknown> | undefined) {
  if (!data) return DEFAULT_MAINTENANCE_CONFIG;
  const translations = data.translations && typeof data.translations === "object"
    ? (data.translations as Record<string, unknown>)
    : {};
  const enabled = data.enabled === true || data.mode === "maintenance";
  const estimatedEndAtIso = timestampIso(data.estimatedEndAt);

  return {
    enabled,
    mode: enabled ? "maintenance" : "normal",
    translations: {
      fr: translation(
        translations.fr,
        DEFAULT_MAINTENANCE_TRANSLATIONS.fr,
      ),
      en: translation(
        translations.en,
        DEFAULT_MAINTENANCE_TRANSLATIONS.en,
      ),
    },
    estimatedEndAtIso,
    showEstimatedEnd: data.showEstimatedEnd === true && Boolean(estimatedEndAtIso),
    updatedAtIso: timestampIso(data.updatedAt),
    updatedBy: text(data.updatedBy),
    updatedByLabel: text(data.updatedByLabel),
    enabledAtIso: timestampIso(data.enabledAt),
    enabledBy: text(data.enabledBy),
    enabledByLabel: text(data.enabledByLabel),
  } satisfies MaintenanceConfig;
}

async function readMaintenanceConfig() {
  try {
    const snapshot = await getFirebaseAdminFirestore()
      .collection(COLLECTION)
      .doc(DOCUMENT)
      .get();
    return toMaintenanceConfig(snapshot.data());
  } catch (error) {
    // Maintenance is an availability control, not an authorization boundary.
    // Keep the application reachable if the configuration store is unavailable.
    console.error("[Maintenance] Unable to read the global configuration.", error);
    return DEFAULT_MAINTENANCE_CONFIG;
  }
}

const getCachedMaintenanceConfig = unstable_cache(
  readMaintenanceConfig,
  ["application-maintenance-config-v1", CACHE_SCOPE],
  {
    tags: [MAINTENANCE_CACHE_TAG],
    revalidate: 60,
  },
);

export async function getMaintenanceConfig() {
  return getCachedMaintenanceConfig();
}

export async function writeMaintenanceConfig(
  input: MaintenanceUpdateInput,
  session: DecodedIdToken,
) {
  const reference = getFirebaseAdminFirestore()
    .collection(COLLECTION)
    .doc(DOCUMENT);
  const currentSnapshot = await reference.get();
  const current = toMaintenanceConfig(currentSnapshot.data());
  const now = Timestamp.now();
  const actorLabel = session.name ?? session.email ?? session.uid;
  const enabling = input.enabled && !current.enabled;
  const estimatedEndAt = input.estimatedEndAtIso
    ? Timestamp.fromDate(new Date(input.estimatedEndAtIso))
    : null;

  await reference.set(
    {
      enabled: input.enabled,
      mode: input.enabled ? "maintenance" : "normal",
      translations: input.translations,
      estimatedEndAt,
      showEstimatedEnd: input.showEstimatedEnd && Boolean(estimatedEndAt),
      updatedAt: now,
      updatedBy: session.uid,
      updatedByLabel: actorLabel,
      ...(enabling
        ? {
            enabledAt: now,
            enabledBy: session.uid,
            enabledByLabel: actorLabel,
          }
        : {}),
    },
    { merge: true },
  );

  return toMaintenanceConfig({
    ...currentSnapshot.data(),
    enabled: input.enabled,
    mode: input.enabled ? "maintenance" : "normal",
    translations: input.translations,
    estimatedEndAt,
    showEstimatedEnd: input.showEstimatedEnd && Boolean(estimatedEndAt),
    updatedAt: now,
    updatedBy: session.uid,
    updatedByLabel: actorLabel,
    ...(enabling
      ? {
          enabledAt: now,
          enabledBy: session.uid,
          enabledByLabel: actorLabel,
        }
      : {}),
  });
}

export async function assertApplicationAvailable(input: {
  session: DecodedIdToken | null;
}) {
  const config = await getMaintenanceConfig();
  if (!config.enabled || (input.session && hasAdminClaim(input.session))) return;
  throw new Error(MAINTENANCE_UNAVAILABLE_CODE);
}
