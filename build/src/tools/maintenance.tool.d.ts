import type { MaintenanceLogDocument } from "../models/operational.models.js";
import { type DatabaseLike } from "../services/mongo.service.js";
export interface GetMaintenanceHistoryInput {
    assetId: string;
}
export interface GetMaintenanceHistoryResult {
    tool: "getMaintenanceHistory";
    assetId: string;
    count: number;
    maintenanceLogs: MaintenanceLogDocument[];
}
export declare function getMaintenanceHistory(input: GetMaintenanceHistoryInput, database?: DatabaseLike): Promise<GetMaintenanceHistoryResult>;
//# sourceMappingURL=maintenance.tool.d.ts.map