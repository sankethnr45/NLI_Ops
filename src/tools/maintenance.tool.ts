import type { Filter } from "mongodb";

import type { MaintenanceLogDocument } from "../models/operational.models.js";
import { getDatabase, type DatabaseLike } from "../services/mongo.service.js";

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
  const maintenanceLogs = await database
    .collection<MaintenanceLogDocument>("maintenance_logs")
    .find({ asset_id: assetId } as Filter<MaintenanceLogDocument>)
    .sort({ timestamp: -1 })
    .toArray();

  return {
    tool: "getMaintenanceHistory",
    assetId,
    count: maintenanceLogs.length,
    maintenanceLogs,
  };
}
