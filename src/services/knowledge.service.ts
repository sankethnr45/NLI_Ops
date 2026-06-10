import { logger } from "../utils/logger.js";
import { getKnowledgeMcpClient, getDiscoveredKnowledgeMcpResources, readKnowledgeResource } from "./mcp/knowledge-mcp-client.service.js";
import { measureAsync } from "../utils/timing.js";

export interface RetrievedResource {
  id: string;
  text: string;
}

// Simple keyword => resource mapping used for retrieval. Keep intentionally tiny.
const KEYWORD_MAP: Array<{ keywords: string[]; resourceId: string }> = [
  { keywords: ["vibration", "vibrat"], resourceId: "resource://procedures/high-vibration-response" },
  { keywords: ["overheat", "overheating", "overheat"], resourceId: "resource://procedures/overheating-response" },
  { keywords: ["compressor", "maintenance", "compressor maintenance"], resourceId: "resource://manuals/compressor-maintenance" },
  { keywords: ["pump", "maintenance", "pump maintenance"], resourceId: "resource://manuals/pump-maintenance" },
];

function normalize(text: string): string {
  return text.toLowerCase();
}

export async function discoverKnowledgeResources(): Promise<string[]> {
  // Ensure client is started and discovery performed.
  await getKnowledgeMcpClient();
  return getDiscoveredKnowledgeMcpResources();
}

export async function retrieveResourcesForQuery(query: string): Promise<RetrievedResource[]> {
  const normalized = normalize(query);

  // Trigger client and discovery if not already done.
  const discovered = await discoverKnowledgeResources();

  const matched = new Set<string>();
  for (const mapping of KEYWORD_MAP) {
    for (const kw of mapping.keywords) {
      if (normalized.includes(kw)) {
        matched.add(mapping.resourceId);
        break;
      }
    }
  }

  // Filter matched resources to only those discovered by the server.
  const availableMatches = Array.from(matched).filter((id) => discovered.includes(id));

  logger.info("Knowledge retrieval - matched resources", { category: "knowledge", query, matches: availableMatches });

  const results: RetrievedResource[] = [];

  for (const resourceId of availableMatches) {
    try {
      const { result: content, durationMs } = await measureAsync(async () => readKnowledgeResource(resourceId));
      // readKnowledgeResource returns string
      const text = typeof content === "string" ? content : JSON.stringify(content);
      logger.info("Knowledge resource read", { category: "knowledge", resourceId, length: text.length });
      results.push({ id: resourceId, text });
    } catch (err) {
      logger.error("Failed to read knowledge resource", err as Error, { category: "knowledge", resourceId });
    }
  }

  return results;
}
