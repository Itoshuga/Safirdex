export function compactTranslations(
  translations: Record<string, Record<string, unknown>> | undefined,
) {
  return Object.fromEntries(
    Object.entries(translations ?? {}).filter(([, translation]) =>
      Object.values(translation).some(
        (entry) => typeof entry === "string" && entry.trim().length > 0,
      ),
    ),
  );
}
