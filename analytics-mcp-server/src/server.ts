import "dotenv/config";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { connectToMongo } from "../../src/services/mongo.service.js";
import { logger } from "../../src/utils/logger.js";
import {
  getRecurringFailures,
  getMostProblematicAssets,
  getAssetHealthSummary,
  getAlertTrendAnalysis,
} from "../../src/tools/analytics.tool.js";

const server = new McpServer({ name: "analytics-mcp-server", version: "1.0.0" });

server.registerTool(
  "getRecurringFailures",
  {
    title: "Get Recurring Failures",
    description: "Identifies assets with repeated alerts and maintenance events.",
    inputSchema: {
      minFailures: z.number().optional(),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    const input: { minFailures?: number } = {};
    if (typeof args.minFailures === "number") input.minFailures = args.minFailures;
    const result = await getRecurringFailures(input);
    return { structuredContent: result as unknown as Record<string, unknown>, content: [{ type: "text", text: JSON.stringify(result) }] };
  },

);

server.registerTool(
  "getMostProblematicAssets",
  {
    title: "Get Most Problematic Assets",
    description: "Ranks assets by a simple risk score using critical alerts and maintenance frequency.",
    inputSchema: {
      limit: z.number().optional(),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    const input: { limit?: number } = {};
    if (typeof args.limit === "number") input.limit = args.limit;
    const result = await getMostProblematicAssets(input);
    return { structuredContent: result as unknown as Record<string, unknown>, content: [{ type: "text", text: JSON.stringify(result) }] };
  },

);

server.registerTool(
  "getAssetHealthSummary",
  {
    title: "Get Asset Health Summary",
    description: "Provides fleet-wide counts of asset health statuses.",
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    const result = await getAssetHealthSummary();
    return { structuredContent: result as unknown as Record<string, unknown>, content: [{ type: "text", text: JSON.stringify(result) }] };
  },
);

server.registerTool(
  "getAlertTrendAnalysis",
  {
    title: "Get Alert Trend Analysis",
    description: "Analyzes alert trends between previous and current periods.",
    inputSchema: {
      days: z.number().optional(),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (args) => {
    const input: { days?: number } = {};
    if (typeof args.days === "number") input.days = args.days;
    const result = await getAlertTrendAnalysis(input);
    return { structuredContent: result as unknown as Record<string, unknown>, content: [{ type: "text", text: JSON.stringify(result) }] };
  },

);

async function main() {
  await connectToMongo();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Analytics MCP server failed", error);
  process.exit(1);
});
