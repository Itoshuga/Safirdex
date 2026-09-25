const COMBINING_MARKS = /[\u0300-\u036f]/g;
const NON_ALPHANUMERIC = /[^a-z0-9]+/g;
const EDGE_HYPHENS = /^-+|-+$/g;

export function createSlug(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(NON_ALPHANUMERIC, "-")
    .replace(EDGE_HYPHENS, "");

  if (!slug) {
    throw new Error("A slug cannot be generated from an empty value.");
  }

  return slug;
}

export async function createUniqueSlug(
  value: string,
  isSlugTaken: (slug: string) => boolean | Promise<boolean>,
) {
  const baseSlug = createSlug(value);
  let candidate = baseSlug;
  let suffix = 2;

  while (await isSlugTaken(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}
