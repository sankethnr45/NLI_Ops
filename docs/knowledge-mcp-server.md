# Knowledge MCP Server

This document describes the knowledge-mcp-server added for educational purposes.

- Purpose: expose read-only operational documentation as MCP Resources (markdown files).
- Location: knowledge-mcp-server/knowledge/*.md
- Host-side helpers: src/services/mcp/knowledge-mcp-client.service.ts

Usage:
- Start the server locally: npm run mcp:knowledge
- In the host, call getKnowledgeMcpClient() then listResources() or use getDiscoveredKnowledgeMcpResources()
- Read a resource with readKnowledgeResource(resourceId)

Notes:
- The server prefers to register true MCP Resources when the SDK supports registerResource; it falls back to registering read-only tools named read:resource://... if resources are not available.
- Accesses are logged via src/utils/logger.ts under category "knowledge".
