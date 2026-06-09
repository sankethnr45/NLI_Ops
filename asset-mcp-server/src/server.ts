import "dotenv/config";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { connectToMongo } from "../../src/services/mongo.service.js";
import { getAssetStatus } from "../../src/tools/assets.tool.js";

const server = new McpServer({
  name: "asset-mcp-server",
  version: "1.0.0",
});

server.registerTool(
  "getAssetStatus",
  {
    title: "Get Asset Status",
    description: "Returns metadata, operating status, and health for one operational asset.",
    inputSchema: {
      assetId: z.string().min(1),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    const result = await getAssetStatus({ assetId: args.assetId });

    return {
      structuredContent: result as unknown as Record<string, unknown>,
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  },
);

async function main() {
  await connectToMongo();

  // Stdio is the simplest MCP transport for local learning: the Express host
  // starts this process and exchanges MCP JSON-RPC messages over stdin/stdout.
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Asset MCP server failed", error);
  process.exit(1);
});
