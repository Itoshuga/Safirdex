type SerializedTimestamp = {
  seconds?: unknown;
  nanoseconds?: unknown;
  _seconds?: unknown;
  _nanoseconds?: unknown;
};

function validDate(value: Date) {
  return Number.isFinite(value.getTime()) ? value : null;
}

/**
 * Converts Firestore timestamps before and after Next.js cache serialization.
 * Cached Timestamp instances are restored as plain objects without `toDate()`.
 */
export function firestoreDate(value: unknown): Date | null {
  if (value instanceof Date) return validDate(value);

  if (typeof value === "string" || typeof value === "number") {
    return validDate(new Date(value));
  }

  if (typeof value !== "object" || value === null) return null;

  if ("toDate" in value && typeof value.toDate === "function") {
    try {
      const date = value.toDate();
      return date instanceof Date ? validDate(date) : null;
    } catch {
      return null;
    }
  }

  if ("toMillis" in value && typeof value.toMillis === "function") {
    try {
      const millis = value.toMillis();
      return typeof millis === "number" ? validDate(new Date(millis)) : null;
    } catch {
      return null;
    }
  }

  const timestamp = value as SerializedTimestamp;
  const seconds = timestamp.seconds ?? timestamp._seconds;
  const nanoseconds = timestamp.nanoseconds ?? timestamp._nanoseconds ?? 0;
  if (typeof seconds !== "number" || typeof nanoseconds !== "number") return null;

  return validDate(new Date((seconds * 1_000) + Math.floor(nanoseconds / 1_000_000)));
}

export function firestoreDateIso(value: unknown, fallback = new Date()) {
  return (firestoreDate(value) ?? fallback).toISOString();
}
