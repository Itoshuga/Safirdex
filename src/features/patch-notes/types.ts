import type { Timestamp } from "firebase-admin/firestore";

import type { Translations } from "@/types/translation";

export type PatchNoteCategory = "update" | "feature" | "announcement" | "maintenance";
export type PatchNoteStatus = "draft" | "published" | "scheduled";
export type PatchNoteMediaLayout = "default" | "wide";

export interface PatchNoteRichTextNode {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  href?: string;
  break?: boolean;
}

export interface PatchNoteImageAsset {
  id: string;
  storagePath: string;
  url: string;
  width?: number;
  height?: number;
}

export interface PatchNoteHeadingBlock {
  id: string;
  type: "heading";
  level: 2 | 3;
  text: string;
}

export interface PatchNoteParagraphBlock {
  id: string;
  type: "paragraph";
  content: PatchNoteRichTextNode[];
}

export interface PatchNoteImageBlock {
  id: string;
  type: "image";
  image: PatchNoteImageAsset;
  alt: string;
  caption?: string;
  layout: PatchNoteMediaLayout;
}

export interface PatchNoteGalleryBlock {
  id: string;
  type: "gallery";
  images: Array<PatchNoteImageAsset & { alt: string; caption?: string }>;
  layout: PatchNoteMediaLayout;
}

export interface PatchNoteVideoBlock {
  id: string;
  type: "video";
  url: string;
  caption?: string;
  layout: PatchNoteMediaLayout;
}

export interface PatchNoteListBlock {
  id: string;
  type: "list";
  ordered: boolean;
  items: string[];
}

export interface PatchNoteCalloutBlock {
  id: string;
  type: "callout";
  variant: "info" | "success" | "warning" | "important";
  title?: string;
  content: PatchNoteRichTextNode[];
}

export interface PatchNoteQuoteBlock {
  id: string;
  type: "quote";
  text: string;
  author?: string;
}

export interface PatchNoteDividerBlock {
  id: string;
  type: "divider";
}

export type PatchNoteBlock =
  | PatchNoteHeadingBlock
  | PatchNoteParagraphBlock
  | PatchNoteImageBlock
  | PatchNoteGalleryBlock
  | PatchNoteVideoBlock
  | PatchNoteListBlock
  | PatchNoteCalloutBlock
  | PatchNoteQuoteBlock
  | PatchNoteDividerBlock;

export interface PatchNoteTranslation {
  title: string;
  excerpt: string;
  blocks: PatchNoteBlock[];
}

export interface PatchNoteDocument {
  id: string;
  slug: string;
  version?: string;
  category: PatchNoteCategory;
  status: PatchNoteStatus;
  tags: string[];
  translations: Translations<PatchNoteTranslation>;
  coverImage?: PatchNoteImageAsset & { alt: Translations<string> };
  author: { userId: string; displayName: string };
  publishedAt?: Timestamp | null;
  scheduledAt?: Timestamp | null;
  visibleAt?: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PatchNoteListItem {
  id: string;
  slug: string;
  version?: string;
  category: PatchNoteCategory;
  title: string;
  excerpt: string;
  coverImage?: PatchNoteImageAsset & { alt: string };
  publishedAtIso: string;
}

export interface PatchNoteDetailView extends PatchNoteListItem {
  blocks: PatchNoteBlock[];
  tags: string[];
  author: { displayName: string };
}

export interface PatchNotePage {
  items: PatchNoteListItem[];
  nextCursor?: string;
}

export type PatchNoteEditorImage = Partial<Omit<PatchNoteImageAsset, "id">> & { id: string };
export type PatchNoteEditorBlock =
  | PatchNoteHeadingBlock
  | PatchNoteParagraphBlock
  | (Omit<PatchNoteImageBlock, "image"> & { image: PatchNoteEditorImage })
  | (Omit<PatchNoteGalleryBlock, "images"> & { images: Array<PatchNoteEditorImage & { alt: string; caption?: string }> })
  | PatchNoteVideoBlock
  | PatchNoteListBlock
  | PatchNoteCalloutBlock
  | PatchNoteQuoteBlock
  | PatchNoteDividerBlock;

export interface PatchNoteEditorValue {
  id?: string;
  slug: string;
  version: string;
  category: PatchNoteCategory;
  status: PatchNoteStatus;
  tags: string[];
  scheduledAt: string;
  coverImage?: PatchNoteEditorImage & { alt: Translations<string> };
  translations: Translations<Omit<PatchNoteTranslation, "blocks"> & { blocks: PatchNoteEditorBlock[] }>;
}
