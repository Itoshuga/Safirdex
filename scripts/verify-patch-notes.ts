import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { getPatchNoteVideoEmbed, isSafePatchNoteLink } from "../src/features/patch-notes/video.ts";
import { deletePatchNoteBlock, insertPatchNoteBlockCopy, movePatchNoteBlock } from "../src/features/patch-notes/editor-operations.ts";
import { isPatchNotePublic } from "../src/features/patch-notes/visibility.ts";
import { patchNoteEditorSchema } from "../src/validation/patch-notes.ts";

const blocks = [
  { id: "heading_1", type: "heading", level: 2, text: "What changed" },
  { id: "paragraph_1", type: "paragraph", content: [{ text: "Read ", bold: true }, { text: "more", href: "/cards" }] },
  { id: "image_1", type: "image", image: { id: "asset_1", storagePath: "patch-notes/a/images/asset_1.webp", url: "https://example.com/a.webp" }, alt: "A preview", layout: "wide" },
  { id: "gallery_1", type: "gallery", images: [{ id: "asset_2", storagePath: "patch-notes/a/images/asset_2.webp", url: "https://example.com/b.webp", alt: "Gallery item" }], layout: "default" },
  { id: "video_1", type: "video", url: "https://youtu.be/dQw4w9WgXcQ", layout: "wide" },
  { id: "list_1", type: "list", ordered: true, items: ["First", "Second"] },
  { id: "callout_1", type: "callout", variant: "info", title: "Note", content: [{ text: "Safe content" }] },
  { id: "quote_1", type: "quote", text: "A quote", author: "Safirdex" },
  { id: "divider_1", type: "divider" },
];

const parsed = patchNoteEditorSchema.parse({
  slug: "safe-update",
  version: "1.0.0",
  category: "update",
  tags: ["release"],
  scheduledAt: "",
  translations: {
    fr: { title: "Mise à jour", excerpt: "Une mise à jour.", blocks },
    en: { title: "Update", excerpt: "An update.", blocks },
  },
});
assert.equal(parsed.translations.fr.blocks.length, 9, "all supported block types should validate");
assert.equal(getPatchNoteVideoEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")?.provider, "youtube");
assert.equal(getPatchNoteVideoEmbed("https://vimeo.com/76979871")?.src, "https://player.vimeo.com/video/76979871");
assert.equal(getPatchNoteVideoEmbed("https://example.com/video"), null, "untrusted embed providers must be rejected");
assert.equal(isSafePatchNoteLink("javascript:alert(1)"), false, "script URLs must be rejected");
assert.equal(isSafePatchNoteLink("/fr/cards"), true);

const now = new Date("2026-09-27T12:00:00.000Z");
assert.equal(isPatchNotePublic("draft", new Date("2026-09-26T12:00:00.000Z"), now), false);
assert.equal(isPatchNotePublic("published", new Date("2026-09-26T12:00:00.000Z"), now), true);
assert.equal(isPatchNotePublic("scheduled", new Date("2026-09-28T12:00:00.000Z"), now), false);
assert.equal(isPatchNotePublic("scheduled", new Date("2026-09-27T11:59:59.000Z"), now), true);

const blockOrder = ["heading", "paragraph", "image"];
assert.deepEqual(movePatchNoteBlock(blockOrder, 2, 0), ["image", "heading", "paragraph"]);
assert.deepEqual(deletePatchNoteBlock(blockOrder, 1), ["heading", "image"]);
assert.deepEqual(insertPatchNoteBlockCopy(blockOrder, 0, "heading-copy"), ["heading", "heading-copy", "paragraph", "image"]);

const [firestoreRules, storageRules] = await Promise.all([
  readFile(new URL("../firestore.rules", import.meta.url), "utf8"),
  readFile(new URL("../storage.rules", import.meta.url), "utf8"),
]);
assert.match(firestoreRules, /match \/patchNotes\/\{patchNoteId\}[\s\S]*allow read, write: if false;/, "direct Firestore access must stay closed");
assert.match(storageRules, /match \/patch-notes\/\{allPaths=\*\*\}[\s\S]*allow read: if true;[\s\S]*allow write: if isAdmin\(\)/, "patch-note media must be public-read/admin-write");

console.log("Patch note validation, embed safety, and Firebase rule checks passed.");
