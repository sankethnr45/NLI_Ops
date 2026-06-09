import { Client } from "@modelcontextprotocol/sdk/client/index.js";
type MaintenanceMcpToolName = "getMaintenanceHistory";
export declare function getMaintenanceMcpClient(): Promise<Client>;
export declare function callMaintenanceMcpTool(name: MaintenanceMcpToolName, args: Record<string, unknown>): Promise<unknown>;
export declare function closeMaintenanceMcpClient(): Promise<void>;
export {};
//# sourceMappingURL=maintenance-mcp-client.service.d.ts.map