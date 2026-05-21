import { env } from "../../config/env.js";
import { createGeminiService } from "./gemini.service.js";
import type { ToolCall, ToolSchema } from "../../tools/tool-registry.js";

export interface ToolResult {
  name: string;
  result: unknown;
}

export interface ToolPlan {
  text: string;
  toolCalls: ToolCall[];
}

export interface LlmService {
  generateToolPlan(message: string, tools: ToolSchema[]): Promise<ToolPlan>;
  summarizeWithToolResults(message: string, toolResults: ToolResult[]): Promise<string>;
}

export function getLlmService(): LlmService {
  switch (env.llmProvider) {
    case "gemini":
      return createGeminiService();
    case "openai":
    case "ollama":
      throw new Error(`${env.llmProvider} provider is not implemented yet. Set LLM_PROVIDER=gemini.`);
    default:
      throw new Error(`Unsupported LLM_PROVIDER: ${env.llmProvider}`);
  }
}
