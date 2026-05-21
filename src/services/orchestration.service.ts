import { getLlmService, type LlmService, type ToolResult } from "./llm/llm.service.js";
import {
  executeOperationalTool,
  operationalToolSchemas,
  type OperationalToolName,
} from "../tools/tool-registry.js";

export type ToolExecutor = (name: OperationalToolName, args: Record<string, unknown>) => Promise<unknown>;

export interface OperationalChatOptions {
  llm?: LlmService;
  toolExecutor?: ToolExecutor;
}

export interface OperationalChatResult {
  response: string;
  toolCalls: string[];
}

function validateMessage(message: string): string {
  const normalizedMessage = message.trim();

  if (!normalizedMessage) {
    throw new Error("message is required.");
  }

  return normalizedMessage;
}

export async function runOperationalChat(
  message: string,
  options: OperationalChatOptions = {},
): Promise<OperationalChatResult> {
  const normalizedMessage = validateMessage(message);
  const llm = options.llm ?? getLlmService();
  const toolExecutor = options.toolExecutor ?? executeOperationalTool;

  const toolPlan = await llm.generateToolPlan(normalizedMessage, operationalToolSchemas);

  if (toolPlan.toolCalls.length === 0) {
    return {
      response: toolPlan.text || "I can answer operational questions when a relevant backend tool is available.",
      toolCalls: [],
    };
  }

  // Tool calls are executed by backend code only. The model chooses a named tool,
  // but it never receives direct MongoDB access or arbitrary query capability.
  const toolResults: ToolResult[] = [];

  for (const toolCall of toolPlan.toolCalls) {
    const result = await toolExecutor(toolCall.name, toolCall.args);
    toolResults.push({
      name: toolCall.name,
      result,
    });
  }

  const response = await llm.summarizeWithToolResults(normalizedMessage, toolResults);

  return {
    response,
    toolCalls: toolPlan.toolCalls.map((toolCall) => toolCall.name),
  };
}
