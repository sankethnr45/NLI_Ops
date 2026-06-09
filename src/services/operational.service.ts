import { logger } from "../utils/logger.js";
import { callAlertsMcpTool } from "./mcp/alerts-mcp-client.service.js";
import { callAssetMcpTool } from "./mcp/asset-mcp-client.service.js";
import { callMaintenanceMcpTool } from "./mcp/maintenance-mcp-client.service.js";

export async function fetchCriticalAlerts() {
  logger.info("Fetching critical alerts", { category: "service", operation: "fetch_alerts" });
  return callAlertsMcpTool("getCriticalAlerts", {});
}

export async function fetchAssetStatus(assetId: string) {
  logger.info("Fetching asset status", { category: "service", operation: "fetch_status", assetId });
  return callAssetMcpTool("getAssetStatus", { assetId });
}

export async function fetchMaintenanceHistory(assetId: string) {
  logger.info("Fetching maintenance history", { category: "service", operation: "fetch_maintenance", assetId });
  return callMaintenanceMcpTool("getMaintenanceHistory", { assetId });
}

export async function fetchHighVibrationAssets(minimumVibration?: number) {
  logger.info("Fetching high vibration assets", { category: "service", operation: "fetch_vibration", minimumVibration });
  return callAlertsMcpTool(
    "getHighVibrationAssets",
    minimumVibration === undefined ? {} : { minimumVibration },
  );
}
