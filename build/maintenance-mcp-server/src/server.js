import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { connectToMongo } from "../../src/services/mongo.service.js";
import { getMaintenanceHistory } from "../../src/tools/maintenance.tool.js";
const server = new McpServer({
    name: "maintenance-mcp-server",
    version: "1.0.0",
});
server.registerTool("getMaintenanceHistory", {
    title: "Get Maintenance History",
    description: "Returns maintenance history entries for one operational asset.",
    inputSchema: {
        assetId: z.string().min(1),
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
}, async (args) => {
    const result = await getMaintenanceHistory({ assetId: args.assetId });
    return {
        structuredContent: result,
        content: [
            {
                type: "text",
                text: JSON.stringify(result),
            },
        ],
    };
});
async function main() {
    await connectToMongo();
    // This MCP server owns maintenance data access. The host can discover and
    // call its tools, but does not execute maintenance business logic directly.
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
main().catch((error) => {
    console.error("Maintenance MCP server failed", error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map