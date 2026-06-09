import type { AssetDocument } from "../models/operational.models.js";
import { type DatabaseLike } from "../services/mongo.service.js";
export interface GetAssetStatusInput {
    assetId: string;
}
export interface GetAssetStatusResult {
    tool: "getAssetStatus";
    found: boolean;
    asset: AssetDocument | null;
}
export declare function getAssetStatus(input: GetAssetStatusInput, database?: DatabaseLike): Promise<GetAssetStatusResult>;
//# sourceMappingURL=assets.tool.d.ts.map