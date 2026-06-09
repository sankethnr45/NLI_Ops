import { Client } from "@modelcontextprotocol/sdk/client/index.js";
type AlertsMcpToolName = "getCriticalAlerts" | "getHighVibrationAssets";
export declare function getAlertsMcpClient(): Promise<Client>;
export declare function getDiscoveredAlertsMcpTools(): string[];
export declare function callAlertsMcpTool(name: AlertsMcpToolName, args: Record<string, unknown>): Promise<unknown>;
export declare function closeAlertsMcpClient(): Promise<void>;
export {};
//# sourceMappingURL=alerts-mcp-client.service.d.ts.map