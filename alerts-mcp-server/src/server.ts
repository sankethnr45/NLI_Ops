import "dotenv/config";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { connectToMongo } from "../../src/services/mongo.service.js";
import { getCriticalAlerts, getHighVibrationAssets } from "../../src/tools/alerts.tool.js";

type AssetType = "compressor" | "pump" | "turbine" | "heat_exchanger";

const server = new McpServer({
  name: "alerts-mcp-server",
  version: "1.0.0",
});

function buildCriticalAlertsInput(args: { assetType?: AssetType | undefined; alertType?: string | undefined }) {
  return {
    ...(args.assetType === undefined ? {} : { assetType: args.assetType }),
    ...(args.alertType === undefined ? {} : { alertType: args.alertType }),
  };
}

function buildHighVibrationInput(args: { minimumVibration?: number | undefined; assetType?: AssetType | undefined }) {
  return {
    ...(args.minimumVibration === undefined ? {} : { minimumVibration: args.minimumVibration }),
    ...(args.assetType === undefined ? {} : { assetType: args.assetType }),
  };
}

server.registerTool(
  "getCriticalAlerts",
  {
    title: "Get Critical Alerts",
    description:
      "Returns critical operational alerts from MongoDB. Supports optional assetType and alertType filters.",
    inputSchema: {
      assetType: z.enum(["compressor", "pump", "turbine", "heat_exchanger"]).optional(),
      alertType: z.string().optional(),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    const result = await getCriticalAlerts(buildCriticalAlertsInput(args));

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

server.registerTool(
  "getHighVibrationAssets",
  {
    title: "Get High Vibration Assets",
    description:
      "Returns sensor readings from MongoDB where vibration is above a threshold, optionally filtered by asset type.",
    inputSchema: {
      minimumVibration: z.number().optional(),
      assetType: z.enum(["compressor", "pump", "turbine", "heat_exchanger"]).optional(),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    const result = await getHighVibrationAssets(buildHighVibrationInput(args));

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

  // MCP transports define how the client and server exchange JSON-RPC messages.
  // Stdio keeps this local and beginner-friendly: the Express app spawns this
  // process and talks to it over stdin/stdout, without HTTP deployment work.
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Alerts MCP server failed", error);
  process.exit(1);
});
