import { getAssetStatus } from "../tools/assets.tool.js";
import { getCriticalAlerts, getHighVibrationAssets } from "../tools/alerts.tool.js";
import { getMaintenanceHistory } from "../tools/maintenance.tool.js";

export async function fetchCriticalAlerts() {
  return getCriticalAlerts();
}

export async function fetchAssetStatus(assetId: string) {
  return getAssetStatus({ assetId });
}

export async function fetchMaintenanceHistory(assetId: string) {
  return getMaintenanceHistory({ assetId });
}

export async function fetchHighVibrationAssets(minimumVibration?: number) {
  return minimumVibration === undefined ? getHighVibrationAssets() : getHighVibrationAssets({ minimumVibration });
}
