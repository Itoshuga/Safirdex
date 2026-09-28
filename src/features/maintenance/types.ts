import type { AppLocale } from "@/lib/i18n/locales";

export type ApplicationMode = "normal" | "maintenance";

export interface MaintenanceTranslation {
  title: string;
  message: string;
}

export interface MaintenanceConfig {
  enabled: boolean;
  mode: ApplicationMode;
  translations: Record<AppLocale, MaintenanceTranslation>;
  estimatedEndAtIso: string | null;
  showEstimatedEnd: boolean;
  updatedAtIso: string | null;
  updatedBy: string | null;
  updatedByLabel: string | null;
  enabledAtIso: string | null;
  enabledBy: string | null;
  enabledByLabel: string | null;
}

export interface MaintenanceUpdateInput {
  enabled: boolean;
  translations: Record<AppLocale, MaintenanceTranslation>;
  estimatedEndAtIso: string | null;
  showEstimatedEnd: boolean;
}

export interface MaintenanceActionResult {
  status: "success" | "error";
  code: "MAINTENANCE_SAVED" | "MAINTENANCE_UPDATE_FAILED";
  config?: MaintenanceConfig;
}
