import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { logger } from "../../src/utils/logger.js";

const server = new McpServer({
  name: "knowledge-mcp-server",
  version: "1.0.0",
});

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findMarkdownFiles(full)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

async function loadAndRegisterResources() {
  const knowledgeDir = path.join(process.cwd(), "knowledge-mcp-server", "knowledge");
  let files = [];
  try {
    files = await findMarkdownFiles(knowledgeDir);
  } catch (err) {
    logger.error("Failed to read knowledge directory", err as Error, { category: "knowledge", operation: "load_files" });
    return;
  }

  for (const filePath of files) {
    const rel = path.relative(path.join(process.cwd(), "knowledge-mcp-server", "knowledge"), filePath);
    // resource id uses forward slashes per URI-like convention
    const resourceId = `resource://${rel.replace(/\\/g, "/").replace(/\.md$/i, "")}`;
    const title = path.basename(filePath, ".md").replace(/[-_]/g, " ");
    const description = `Knowledge resource: ${title}`;

    // Attempt to use server.registerResource if available (SDK supports resources),
    // but fall back to registering read-only tools named after the resource if API differs.
    try {
      // Prefer resource registration when available.
      // @ts-ignore - runtime SDK may provide registerResource
      if (typeof server.registerResource === "function") {
        // Register a resource that returns markdown text as the content.
        // The handler is invoked when clients call readResource.
        // Use contentType text/markdown and include a text content part.
        // @ts-ignore
        server.registerResource(
          resourceId,
          {
            title,
            description,
            contentType: "text/markdown",
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
              openWorldHint: true,
            },
          },
          async () => {
            const text = await fs.readFile(filePath, "utf8");
            logger.info("Resource read", { category: "knowledge", resourceId });

            return {
              content: [
                {
                  type: "text",
                  text,
                },
              ],
            };
          },
        );
      } else {
        // Fallback: register a tool that reads the file. This keeps compatibility
        // with hosts that only expect tools but still exposes the content.
        // @ts-ignore
        server.registerTool(
          `read:${resourceId}`,
          {
            title: `Read ${title}`,
            description,
            inputSchema: {},
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
              openWorldHint: true,
            },
          },
          async () => {
            const text = await fs.readFile(filePath, "utf8");
            logger.info("Resource tool read", { category: "knowledge", resourceId });

            return {
              content: [
                {
                  type: "text",
                  text,
                },
              ],
            };
          },
        );
      }
    } catch (error) {
      logger.error("Failed to register knowledge resource", error as Error, { resourceId });
    }
  }
}

async function main() {
  await loadAndRegisterResources();

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Knowledge MCP server failed", error);
  process.exit(1);
});
