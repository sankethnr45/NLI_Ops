import type { Filter } from "mongodb";

import type { AssetDocument } from "../models/operational.models.js";
import { getDatabase, type DatabaseLike } from "../services/mongo.service.js";
import { logger } from "../utils/logger.js";
import { measureAsync } from "../utils/timing.js";

export interface GetAssetStatusInput {
  assetId: string;
}

export interface GetAssetStatusResult {
  tool: "getAssetStatus";
  found: boolean;
  asset: AssetDocument | null;
}

function validateAssetId(assetId: string): string {
  const normalizedAssetId = assetId.trim();

  if (!normalizedAssetId) {
    throw new Error("assetId is required.");
  }

  return normalizedAssetId;
}

export async function getAssetStatus(
  input: GetAssetStatusInput,
  database: DatabaseLike = getDatabase(),
): Promise<GetAssetStatusResult> {
  const assetId = validateAssetId(input.assetId);
  const assets = database.collection<AssetDocument>("assets");
  logger.info("Executing query", { category: "mongo", operation: "findOne", collection: "assets", query: { asset_id: assetId } });
  const { result: asset, durationMs } = await measureAsync(() =>
    assets.findOne({ asset_id: assetId } as Filter<AssetDocument>),
  );
  logger.info("MongoDB query completed", {
    category: "mongo",
    operation: "findOne_complete",
    collection: "assets",
    durationMs,
  });

  return {
    tool: "getAssetStatus",
    found: asset !== null,
    asset,
  };
}
