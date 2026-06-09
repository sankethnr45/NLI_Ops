import { callAlertsMcpTool } from "../services/mcp/alerts-mcp-client.service.js";
import { callAssetMcpTool } from "../services/mcp/asset-mcp-client.service.js";
import { callMaintenanceMcpTool } from "../services/mcp/maintenance-mcp-client.service.js";
const operationalToolNames = [
    "getCriticalAlerts",
    "getAssetStatus",
    "getMaintenanceHistory",
    "getHighVibrationAssets",
];
export const operationalToolSchemas = [
    {
        name: "getCriticalAlerts",
        description: "Return critical operational alerts. Use this for critical alerts, critical vibration alerts, and asset-type-specific alert questions.",
        parameters: {
            type: "object",
            properties: {
                assetType: {
                    type: "string",
                    enum: ["compressor", "pump", "turbine", "heat_exchanger"],
                    description: "Optional asset type filter, for example compressor.",
                },
                alertType: {
                    type: "string",
                    description: "Optional alert type filter, for example high_vibration or overheating.",
                },
            },
        },
    },
    {
        name: "getAssetStatus",
        description: "Return metadata, operating status, and health for one asset ID.",
        parameters: {
            type: "object",
            properties: {
                assetId: {
                    type: "string",
                    description: "Operational asset ID, for example 248K001B.",
                },
            },
            required: ["assetId"],
        },
    },
    {
        name: "getMaintenanceHistory",
        description: "Return maintenance history entries for one asset ID.",
        parameters: {
            type: "object",
            properties: {
                assetId: {
                    type: "string",
                    description: "Operational asset ID, for example 248K001B.",
                },
            },
            required: ["assetId"],
        },
    },
    {
        name: "getHighVibrationAssets",
        description: "Return raw sensor readings for assets whose vibration is above a threshold. Use this for telemetry threshold questions, not alert severity questions.",
        parameters: {
            type: "object",
            properties: {
                minimumVibration: {
                    type: "number",
                    description: "Minimum vibration threshold. Defaults to 7.",
                },
                assetType: {
                    type: "string",
                    enum: ["compressor", "pump", "turbine", "heat_exchanger"],
                    description: "Optional asset type filter, for example compressor.",
                },
            },
        },
    },
];
export function isOperationalToolName(name) {
    return operationalToolNames.includes(name);
}
function readStringArg(args, key) {
    const value = args[key];
    if (typeof value !== "string") {
        throw new Error(`${key} must be a string.`);
    }
    return value;
}
function readOptionalNumberArg(args, key) {
    const value = args[key];
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "number") {
        throw new Error(`${key} must be a number.`);
    }
    return value;
}
function readOptionalStringArg(args, key) {
    const value = args[key];
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== "string") {
        throw new Error(`${key} must be a string.`);
    }
    return value;
}
export async function executeOperationalTool(name, args) {
    switch (name) {
        case "getCriticalAlerts": {
            const assetType = readOptionalStringArg(args, "assetType");
            const alertType = readOptionalStringArg(args, "alertType");
            return callAlertsMcpTool("getCriticalAlerts", {
                ...(assetType === undefined ? {} : { assetType }),
                ...(alertType === undefined ? {} : { alertType }),
            });
        }
        case "getAssetStatus":
            return callAssetMcpTool("getAssetStatus", { assetId: readStringArg(args, "assetId") });
        case "getMaintenanceHistory":
            return callMaintenanceMcpTool("getMaintenanceHistory", { assetId: readStringArg(args, "assetId") });
        case "getHighVibrationAssets": {
            const minimumVibration = readOptionalNumberArg(args, "minimumVibration");
            const assetType = readOptionalStringArg(args, "assetType");
            return callAlertsMcpTool("getHighVibrationAssets", {
                ...(minimumVibration === undefined ? {} : { minimumVibration }),
                ...(assetType === undefined ? {} : { assetType }),
            });
        }
    }
}
//# sourceMappingURL=tool-registry.js.map