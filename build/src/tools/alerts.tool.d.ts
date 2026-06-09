import type { AlertDocument, AssetDocument, SensorReadingDocument } from "../models/operational.models.js";
import { type DatabaseLike } from "../services/mongo.service.js";
export interface GetCriticalAlertsInput {
    assetType?: string;
    alertType?: string;
}
export type EnrichedAlert = AlertDocument & {
    asset: AssetDocument | null;
};
export interface GetCriticalAlertsResult {
    tool: "getCriticalAlerts";
    count: number;
    alerts: EnrichedAlert[];
}
export interface GetHighVibrationAssetsInput {
    minimumVibration?: number;
    assetType?: string;
}
export type EnrichedSensorReading = SensorReadingDocument & {
    asset: AssetDocument | null;
};
export interface GetHighVibrationAssetsResult {
    tool: "getHighVibrationAssets";
    threshold: number;
    count: number;
    assets: EnrichedSensorReading[];
}
export declare function getCriticalAlerts(input?: GetCriticalAlertsInput, database?: DatabaseLike): Promise<GetCriticalAlertsResult>;
export declare function getHighVibrationAssets(input?: GetHighVibrationAssetsInput, database?: DatabaseLike): Promise<GetHighVibrationAssetsResult>;
//# sourceMappingURL=alerts.tool.d.ts.map