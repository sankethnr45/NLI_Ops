import type { Filter } from "mongodb";

import type { MaintenanceLogDocument } from "../models/operational.models.js";
import { getDatabase, type DatabaseLike } from "../services/mongo.service.js";
import { logger } from "../utils/logger.js";
import { measureAsync } from "../utils/timing.js";

export interface GetMaintenanceHistoryInput {
  assetId: string;
}

export interface GetMaintenanceHistoryResult {
  tool: "getMaintenanceHistory";
  assetId: string;
  count: number;
  maintenanceLogs: MaintenanceLogDocument[];
}

function validateAssetId(assetId: string): string {
  const normalizedAssetId = assetId.trim();

  if (!normalizedAssetId) {
    throw new Error("assetId is required.");
  }

  return normalizedAssetId;
}

export async function getMaintenanceHistory(
  input: GetMaintenanceHistoryInput,
  database: DatabaseLike = getDatabase(),
): Promise<GetMaintenanceHistoryResult> {
  const assetId = validateAssetId(input.assetId);
  logger.info("Executing query", { category: "mongo", operation: "find", collection: "maintenance_logs", query: { asset_id: assetId } });
  const { result: maintenanceLogs, durationMs } = await measureAsync(() =>
    database
      .collection<MaintenanceLogDocument>("maintenance_logs")
      .find({ asset_id: assetId } as Filter<MaintenanceLogDocument>)
      .sort({ timestamp: -1 })
      .toArray(),
  );
  logger.info("MongoDB query completed", {
    category: "mongo",
    operation: "find_complete",
    collection: "maintenance_logs",
    durationMs,
    resultCount: maintenanceLogs.length,
  });

  return {
    tool: "getMaintenanceHistory",
    assetId,
    count: maintenanceLogs.length,
    maintenanceLogs,
  };
}
