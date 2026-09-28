"use server";

import { updateTag } from "next/cache";

import { requireAdminSession } from "@/lib/auth/admin-session";
import { maintenanceUpdateSchema } from "@/features/maintenance/schema";
import {
  getMaintenanceConfig,
  MAINTENANCE_CACHE_TAG,
  writeMaintenanceConfig,
} from "@/features/maintenance/server/maintenance-service";
import type {
  MaintenanceActionResult,
  MaintenanceUpdateInput,
} from "@/features/maintenance/types";

export async function updateMaintenanceConfigAction(
  input: MaintenanceUpdateInput,
): Promise<MaintenanceActionResult> {
  try {
    const session = await requireAdminSession();
    const parsed = maintenanceUpdateSchema.parse(input);
    const config = await writeMaintenanceConfig(parsed, session);
    updateTag(MAINTENANCE_CACHE_TAG);
    return { status: "success", code: "MAINTENANCE_SAVED", config };
  } catch (error) {
    console.error("Maintenance configuration update failed", error);
    return { status: "error", code: "MAINTENANCE_UPDATE_FAILED" };
  }
}

export async function setMaintenanceEnabledAction(
  enabled: boolean,
): Promise<MaintenanceActionResult> {
  try {
    const session = await requireAdminSession();
    const current = await getMaintenanceConfig();
    const input = maintenanceUpdateSchema.parse({
      enabled,
      translations: current.translations,
      estimatedEndAtIso: current.estimatedEndAtIso,
      showEstimatedEnd: current.showEstimatedEnd,
    });
    const config = await writeMaintenanceConfig(input, session);
    updateTag(MAINTENANCE_CACHE_TAG);
    return { status: "success", code: "MAINTENANCE_SAVED", config };
  } catch (error) {
    console.error("Maintenance state update failed", error);
    return { status: "error", code: "MAINTENANCE_UPDATE_FAILED" };
  }
}
