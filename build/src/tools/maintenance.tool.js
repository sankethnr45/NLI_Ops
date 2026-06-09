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
export async function getMaintenanceHistory(input, database = getDatabase()) {
    const assetId = validateAssetId(input.assetId);
    logger.info("Executing query", { category: "mongo", operation: "find", collection: "maintenance_logs", query: { asset_id: assetId } });
    const { result: maintenanceLogs, durationMs } = await measureAsync(() => database
        .collection("maintenance_logs")
        .find({ asset_id: assetId })
        .sort({ timestamp: -1 })
        .toArray());
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
//# sourceMappingURL=maintenance.tool.js.map