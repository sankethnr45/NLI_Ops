import { existsSync } from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { logger } from "../../utils/logger.js";
let client = null;
let transport = null;
let discoveredTools = [];
function getServerCommand() {
    const builtServerPath = path.join(process.cwd(), "build", "alerts-mcp-server", "src", "server.js");
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
            path.join(process.cwd(), "alerts-mcp-server", "src", "server.ts"),
        ],
    };
}
export async function getAlertsMcpClient() {
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
        },
        stderr: "inherit",
    });
    await nextClient.connect(nextTransport);
    // Tool discovery is the MCP handshake moment we care about here: the backend
    // asks the server which tools it exposes instead of assuming a local function.
    const toolsResult = await nextClient.listTools();
    discoveredTools = toolsResult.tools.map((tool) => tool.name);
    logger.info("Discovered alerts MCP tools", {
        category: "mcp",
        operation: "list_tools",
        tools: discoveredTools,
    });
    client = nextClient;
    transport = nextTransport;
    return client;
}
export function getDiscoveredAlertsMcpTools() {
    return discoveredTools;
}
export async function callAlertsMcpTool(name, args) {
    const mcpClient = await getAlertsMcpClient();
    if (!discoveredTools.includes(name)) {
        throw new Error(`Alerts MCP server did not expose required tool: ${name}`);
    }
    logger.info("Calling alerts MCP tool", {
        category: "mcp",
        operation: "call_tool",
        toolName: name,
        args,
    });
    // Tool execution is remote from the Express app's perspective. The MCP client
    // sends a JSON-RPC callTool request over stdio and receives structured content.
    const result = await mcpClient.callTool({
        name,
        arguments: args,
    });
    if ("structuredContent" in result && result.structuredContent) {
        return result.structuredContent;
    }
    const content = "content" in result && Array.isArray(result.content) ? result.content : [];
    const text = content.find((part) => typeof part === "object" &&
        part !== null &&
        "type" in part &&
        part.type === "text" &&
        "text" in part &&
        typeof part.text === "string")?.text;
    if (!text) {
        throw new Error(`Alerts MCP tool ${name} returned no structured or text content.`);
    }
    return JSON.parse(text);
}
export async function closeAlertsMcpClient() {
    await client?.close();
    await transport?.close();
    client = null;
    transport = null;
    discoveredTools = [];
}
//# sourceMappingURL=alerts-mcp-client.service.js.map