import { existsSync } from "node:fs";
import path from "node:path";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { logger } from "../../utils/logger.js";

let client: Client | null = null;
let transport: StdioClientTransport | null = null;
let discoveredResources: string[] = [];

function getServerCommand() {
  const builtServerPath = path.join(process.cwd(), "build", "knowledge-mcp-server", "src", "server.js");

  if (existsSync(builtServerPath)) {
    return {
      command: process.execPath,
      args: [builtServerPath],
    };
  }

  return {
    command: process.execPath,
    args: [
      path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"),
      path.join(process.cwd(), "knowledge-mcp-server", "src", "server.ts"),
    ],
  };
}

export async function getKnowledgeMcpClient(): Promise<Client> {
  if (client) {
    return client;
  }

  const serverCommand = getServerCommand();
  const nextClient = new Client({
    name: "nli-ops-assistant-express-backend",
    version: "1.0.0",
  });
  const nextTransport = new StdioClientTransport({
    ...serverCommand,
    cwd: process.cwd(),
    env: {
      ...process.env,
    } as Record<string, string>,
    stderr: "inherit",
  });

  await nextClient.connect(nextTransport);

  // Resource discovery: ask server which resources it exposes.
  // The SDK client exposes listResources() which returns { resources: [...] }
  try {
    // @ts-ignore
    const resourcesResult = await nextClient.listResources();
    // @ts-ignore
    discoveredResources = Array.isArray(resourcesResult?.resources)
      ? resourcesResult.resources.map((r: any) => r.id)
      : [];
    logger.info("Discovered knowledge MCP resources", {
      category: "mcp",
      operation: "list_resources",
      resources: discoveredResources,
    });
  } catch (err) {
    // If the server does not implement resources, discoveredResources stays empty.
    logger.warn("Failed to list resources from knowledge MCP server", { error: err });
  }

  client = nextClient;
  transport = nextTransport;
  return client;
}

export function getDiscoveredKnowledgeMcpResources(): string[] {
  return discoveredResources;
}

export async function readKnowledgeResource(resourceId: string): Promise<string> {
  const mcpClient = await getKnowledgeMcpClient();

  if (!discoveredResources.includes(resourceId)) {
    throw new Error(`Knowledge MCP server did not expose required resource: ${resourceId}`);
  }

  logger.info("Reading knowledge resource", {
    category: "mcp",
    operation: "read_resource",
    resourceId,
  });

  // @ts-ignore
  const result = await mcpClient.readResource({ id: resourceId });

  if (result && "structuredContent" in result && result.structuredContent) {
    return JSON.stringify(result.structuredContent);
  }

  const content = Array.isArray(result?.content) ? result.content : [];
  const text = content.find((part: any) => part && part.type === "text" && typeof part.text === "string")?.text;

  if (!text) {
    throw new Error(`Knowledge MCP resource ${resourceId} returned no content.`);
  }

  return text;
}

export async function closeKnowledgeMcpClient(): Promise<void> {
  await client?.close();
  await transport?.close();
  client = null;
  transport = null;
  discoveredResources = [];
}
