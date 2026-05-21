import { getAssetStatus } from "../tools/assets.tool.js";
import { getCriticalAlerts, getHighVibrationAssets } from "../tools/alerts.tool.js";
import { getMaintenanceHistory } from "../tools/maintenance.tool.js";
import { logger } from "../utils/logger.js";

export async function fetchCriticalAlerts() {
  logger.info("Fetching critical alerts", { category: "service", operation: "fetch_alerts" });
  return getCriticalAlerts();
}

export async function fetchAssetStatus(assetId: string) {
  logger.info("Fetching asset status", { category: "service", operation: "fetch_status", assetId });
  return getAssetStatus({ assetId });
}

export async function fetchMaintenanceHistory(assetId: string) {
  logger.info("Fetching maintenance history", { category: "service", operation: "fetch_maintenance", assetId });
  return getMaintenanceHistory({ assetId });
}

export async function fetchHighVibrationAssets(minimumVibration?: number) {
  logger.info("Fetching high vibration assets", { category: "service", operation: "fetch_vibration", minimumVibration });
  return minimumVibration === undefined ? getHighVibrationAssets() : getHighVibrationAssets({ minimumVibration });
}
