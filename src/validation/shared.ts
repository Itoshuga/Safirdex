import type { Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

export const requiredStringSchema = z.string().trim().min(1).max(500);

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "A slug can only contain lowercase letters, numbers, and single hyphens.",
  );

export const localeSchema = z
  .string()
  .trim()
  .regex(
    /^[a-zA-Z]{2,3}(?:-[a-zA-Z0-9]{2,8})*$/,
    "Invalid locale identifier.",
  );

export const storagePathSchema = z
  .string()
  .trim()
  .min(1)
  .max(1024)
  .refine((path) => !path.startsWith("/"), "Storage paths must be relative.")
  .refine((path) => !path.includes(".."), "Storage paths cannot contain '..'.")
  .refine((path) => !path.includes("://"), "Use a Storage path, not a URL.")
  .refine((path) => !path.includes("//"), "Storage paths cannot contain '//'.");

export const timestampSchema = z.custom<Timestamp>(
  (value) => {
    return (
      typeof value === "object" &&
      value !== null &&
      "toDate" in value &&
      typeof value.toDate === "function"
    );
  },
  { message: "Expected a Firestore Timestamp." },
);

export const entityFieldsSchema = z.object({
  id: requiredStringSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export function translationsSchema<TSchema extends z.ZodType>(
  translationSchema: TSchema,
) {
  return z
    .record(localeSchema, translationSchema)
    .refine(
      (translations) => Object.keys(translations).length > 0,
      "At least one translation is required.",
    );
}

export function nonEmptyUpdate<TSchema extends z.ZodRawShape>(
  schema: z.ZodObject<TSchema>,
) {
  return schema.partial().refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided.",
  });
}
