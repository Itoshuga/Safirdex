import "server-only";

export function logFirestoreRead(operation: string, expectedDocuments?: number) {
  if (process.env.NODE_ENV !== "development") return;

  const suffix =
    expectedDocuments === undefined
      ? ""
      : ` (up to ${expectedDocuments} document${expectedDocuments === 1 ? "" : "s"})`;
  console.info(`[Firestore] ${operation}${suffix}`);
}

export function logCacheMiss(resource: string) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[Cache MISS] ${resource}`);
  }
}
