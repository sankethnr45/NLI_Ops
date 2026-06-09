export type OperationalToolName = "getCriticalAlerts" | "getAssetStatus" | "getMaintenanceHistory" | "getHighVibrationAssets";
export interface ToolCall {
    name: OperationalToolName;
    args: Record<string, unknown>;
}
export interface ToolSchema {
    name: OperationalToolName;
    description: string;
    parameters: {
        type: "object";
        properties: Record<string, unknown>;
        required?: string[];
    };
}
export declare const operationalToolSchemas: ToolSchema[];
export declare function isOperationalToolName(name: string): name is OperationalToolName;
export declare function executeOperationalTool(name: OperationalToolName, args: Record<string, unknown>): Promise<unknown>;
//# sourceMappingURL=tool-registry.d.ts.map