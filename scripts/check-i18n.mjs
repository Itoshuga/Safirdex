import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const localeSource = await readFile(
  path.join(process.cwd(), "src", "lib", "i18n", "locales.ts"),
  "utf8",
);
const supportedMatch = localeSource.match(
  /SUPPORTED_LOCALES\s*=\s*\[([^\]]+)]/,
);
const defaultMatch = localeSource.match(
  /DEFAULT_LOCALE[^=]*=\s*["']([^"']+)["']/,
);

if (!supportedMatch || !defaultMatch) {
  throw new Error("Unable to read the central locale configuration.");
}

const supportedLocales = Array.from(
  supportedMatch[1].matchAll(/["']([^"']+)["']/g),
  (match) => match[1],
);
const defaultLocale = defaultMatch[1];

function flatten(value, prefix = "") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

async function readMessages(locale) {
  const directory = path.join(process.cwd(), "messages", locale);
  const files = (await readdir(directory)).filter((file) => file.endsWith(".json"));
  const entries = await Promise.all(
    files.map(async (file) => {
      const content = JSON.parse(await readFile(path.join(directory, file), "utf8"));
      return [file, new Set(flatten(content))];
    }),
  );

  return new Map(entries);
}

const reference = await readMessages(defaultLocale);
let failed = false;

for (const locale of supportedLocales) {
  if (locale === defaultLocale) continue;
  const candidate = await readMessages(locale);

  for (const [file, referenceKeys] of reference) {
    const candidateKeys = candidate.get(file);
    if (!candidateKeys) {
      console.error(`[${locale}] Missing file: ${file}`);
      failed = true;
      continue;
    }

    for (const key of referenceKeys) {
      if (!candidateKeys.has(key)) {
        console.error(`[${locale}] Missing key in ${file}: ${key}`);
        failed = true;
      }
    }

    for (const key of candidateKeys) {
      if (!referenceKeys.has(key)) {
        console.error(`[${locale}] Extra key in ${file}: ${key}`);
        failed = true;
      }
    }
  }

  for (const file of candidate.keys()) {
    if (!reference.has(file)) {
      console.error(`[${locale}] Extra file: ${file}`);
      failed = true;
    }
  }
}

if (failed) process.exitCode = 1;
else console.log(`i18n messages are consistent (${supportedLocales.join(", ")}).`);
