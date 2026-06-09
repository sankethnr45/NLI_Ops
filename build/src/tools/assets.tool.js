import { getDatabase } from "../services/mongo.service.js";
import { logger } from "../utils/logger.js";
import { measureAsync } from "../utils/timing.js";
function validateAssetId(assetId) {
    const normalizedAssetId = assetId.trim();
    if (!normalizedAssetId) {
        throw new Error("assetId is required.");
    }
    return normalizedAssetId;
}
export async function getAssetStatus(input, database = getDatabase()) {
    const assetId = validateAssetId(input.assetId);
    const assets = database.collection("assets");
    logger.info("Executing query", { category: "mongo", operation: "findOne", collection: "assets", query: { asset_id: assetId } });
    const { result: asset, durationMs } = await measureAsync(() => assets.findOne({ asset_id: assetId }));
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
//# sourceMappingURL=assets.tool.js.map