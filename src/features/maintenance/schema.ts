import { z } from "zod";

const maintenanceTranslationSchema = z.object({
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(1_000),
});

export const maintenanceUpdateSchema = z.object({
  enabled: z.boolean(),
  translations: z.object({
    fr: maintenanceTranslationSchema,
    en: maintenanceTranslationSchema,
  }),
  estimatedEndAtIso: z
    .string()
    .datetime({ offset: true })
    .nullable(),
  showEstimatedEnd: z.boolean(),
});
