import { type LlmService } from "./llm/llm.service.js";
import { type OperationalToolName } from "../tools/tool-registry.js";
export type ToolExecutor = (name: OperationalToolName, args: Record<string, unknown>) => Promise<unknown>;
export interface OperationalChatOptions {
    llm?: LlmService;
    toolExecutor?: ToolExecutor;
}
export interface OperationalChatResult {
    response: string;
    toolCalls: string[];
}
export interface OperationalChatStreamEvent {
    event: "status" | "tool_start" | "tool_done" | "token" | "done";
    data: Record<string, unknown>;
}
export declare function runOperationalChat(message: string, options?: OperationalChatOptions): Promise<OperationalChatResult>;
export declare function streamOperationalChat(message: string, options?: OperationalChatOptions): AsyncIterable<OperationalChatStreamEvent>;
//# sourceMappingURL=orchestration.service.d.ts.map