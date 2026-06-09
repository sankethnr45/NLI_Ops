import { Client } from "@modelcontextprotocol/sdk/client/index.js";
type AssetMcpToolName = "getAssetStatus";
export declare function getAssetMcpClient(): Promise<Client>;
export declare function callAssetMcpTool(name: AssetMcpToolName, args: Record<string, unknown>): Promise<unknown>;
export declare function closeAssetMcpClient(): Promise<void>;
export {};
//# sourceMappingURL=asset-mcp-client.service.d.ts.map