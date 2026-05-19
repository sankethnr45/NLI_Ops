import type { Filter } from "mongodb";

import type { AssetDocument } from "../models/operational.models.js";
import { getDatabase, type DatabaseLike } from "../services/mongo.service.js";

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
  const asset = await assets.findOne({ asset_id: assetId } as Filter<AssetDocument>);

  return {
    tool: "getAssetStatus",
    found: asset !== null,
    asset,
  };
}
