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
    generateFollowUpToolPlan(message: string, toolResults: ToolResult[], tools: ToolSchema[]): Promise<ToolPlan>;
    summarizeWithToolResults(message: string, toolResults: ToolResult[]): Promise<string>;
    streamSummaryWithToolResults(message: string, toolResults: ToolResult[]): AsyncIterable<string>;
}
export declare function getLlmService(): LlmService;
//# sourceMappingURL=llm.service.d.ts.map