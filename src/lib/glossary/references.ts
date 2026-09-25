export const GLOSSARY_REFERENCE_FORMAT = "[[glossary:key]]";

const GLOSSARY_REFERENCE_SOURCE =
  String.raw`\[\[glossary:([a-z0-9]+(?:-[a-z0-9]+)*)\]\]`;

export interface GlossaryReference {
  key: string;
  raw: string;
  index: number;
}

export type GlossaryContentToken =
  | { type: "text"; value: string }
  | { type: "glossary"; key: string; raw: string };

export function extractGlossaryReferences(content: string) {
  const pattern = new RegExp(GLOSSARY_REFERENCE_SOURCE, "g");

  return Array.from(content.matchAll(pattern), (match): GlossaryReference => {
    return {
      key: match[1],
      raw: match[0],
      index: match.index,
    };
  });
}

export function getGlossaryKeys(content: string) {
  return [
    ...new Set(extractGlossaryReferences(content).map(({ key }) => key)),
  ];
}

export function tokenizeGlossaryContent(content: string): GlossaryContentToken[] {
  const references = extractGlossaryReferences(content);
  const tokens: GlossaryContentToken[] = [];
  let cursor = 0;

  for (const reference of references) {
    if (reference.index > cursor) {
      tokens.push({
        type: "text",
        value: content.slice(cursor, reference.index),
      });
    }

    tokens.push({
      type: "glossary",
      key: reference.key,
      raw: reference.raw,
    });
    cursor = reference.index + reference.raw.length;
  }

  if (cursor < content.length) {
    tokens.push({ type: "text", value: content.slice(cursor) });
  }

  return tokens;
}
