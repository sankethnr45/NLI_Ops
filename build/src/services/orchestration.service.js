import { getLlmService } from "./llm/llm.service.js";
import { retrieveResourcesForQuery } from "./knowledge.service.js";
import { logger } from "../utils/logger.js";
import { measureAsync } from "../utils/timing.js";
import { executeOperationalTool, operationalToolSchemas, } from "../tools/tool-registry.js";
function validateMessage(message) {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
        throw new Error("message is required.");
    }
    return normalizedMessage;
}
export async function runOperationalChat(message, options = {}) {
    const normalizedMessage = validateMessage(message);
    const requestId = `chat_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const orchestrationStartedAt = Date.now();
    const llm = options.llm ?? getLlmService();
    const toolExecutor = options.toolExecutor ?? executeOperationalTool;
    logger.info("Orchestration request received", { category: "orchestration", requestId, message: normalizedMessage });
    const { result: toolPlan, durationMs: planningDurationMs } = await measureAsync(() => llm.generateToolPlan(normalizedMessage, operationalToolSchemas));
    logger.info("Initial tool plan generated", {
        category: "llm",
        operation: "tool_plan",
        requestId,
        durationMs: planningDurationMs,
        tools: toolPlan.toolCalls,
    });
    if (toolPlan.toolCalls.length === 0) {
        logger.info("Orchestration completed without tools", {
            category: "orchestration",
            requestId,
            durationMs: Date.now() - orchestrationStartedAt,
        });
        return {
            response: toolPlan.text || "I can answer operational questions when a relevant backend tool is available.",
            toolCalls: [],
        };
    }
    // Tool calls are executed by backend code only. The model chooses a named tool,
    // but it never receives direct MongoDB access or arbitrary query capability.
    const toolResults = [];
    const executedToolKeys = new Set();
    for (const toolCall of toolPlan.toolCalls) {
        const key = `${toolCall.name}:${JSON.stringify(toolCall.args)}`;
        executedToolKeys.add(key);
        logger.info("Executing selected tool", {
            category: "tool",
            operation: "execute",
            requestId,
            toolName: toolCall.name,
            args: toolCall.args,
        });
        const { result, durationMs } = await measureAsync(() => toolExecutor(toolCall.name, toolCall.args));
        logger.info("Tool execution completed", {
            category: "tool",
            operation: "execute_complete",
            requestId,
            toolName: toolCall.name,
            durationMs,
        });
        toolResults.push({ name: toolCall.name, result });
    }
    const { result: followUpPlan, durationMs: followUpDurationMs } = await measureAsync(() => llm.generateFollowUpToolPlan(normalizedMessage, toolResults, operationalToolSchemas));
    const followUpToolCalls = followUpPlan.toolCalls.filter((toolCall) => {
        const key = `${toolCall.name}:${JSON.stringify(toolCall.args)}`;
        return !executedToolKeys.has(key);
    });
    logger.info("Follow-up tool plan generated", {
        category: "llm",
        operation: "follow_up_tool_plan",
        requestId,
        durationMs: followUpDurationMs,
        tools: followUpToolCalls,
    });
    for (const toolCall of followUpToolCalls) {
        const key = `${toolCall.name}:${JSON.stringify(toolCall.args)}`;
        executedToolKeys.add(key);
        logger.info("Executing follow-up tool", {
            category: "tool",
            operation: "execute_follow_up",
            requestId,
            toolName: toolCall.name,
            args: toolCall.args,
        });
        const { result, durationMs } = await measureAsync(() => toolExecutor(toolCall.name, toolCall.args));
        logger.info("Follow-up tool execution completed", {
            category: "tool",
            operation: "execute_follow_up_complete",
            requestId,
            toolName: toolCall.name,
            durationMs,
        });
        toolResults.push({ name: toolCall.name, result });
    }
    logger.info("Summarizing aggregated tool results", {
        category: "llm",
        operation: "summary",
        requestId,
        toolResultsCount: toolResults.length,
    });
    // Retrieve and inject knowledge resources (RAG) to ground the summary when available.
    const { result: retrievedResources, durationMs: retrievalDurationMs } = await measureAsync(() => retrieveResourcesForQuery(normalizedMessage));
    if (Array.isArray(retrievedResources) && retrievedResources.length > 0) {
        logger.info("Injecting retrieved knowledge into LLM context", {
            category: "knowledge",
            requestId,
            resources: retrievedResources.map((r) => r.id),
            retrievalDurationMs,
        });
        // Synthesize a knowledge tool result so the existing LLM summary flow can consume it.
        toolResults.push({ name: "knowledge", result: retrievedResources });
    }
    const { result: response, durationMs: summaryDurationMs } = await measureAsync(() => llm.summarizeWithToolResults(normalizedMessage, toolResults));
    logger.info("Orchestration completed", {
        category: "orchestration",
        requestId,
        summaryDurationMs,
        durationMs: Date.now() - orchestrationStartedAt,
        toolCalls: toolResults.map((toolResult) => toolResult.name),
    });
    return {
        response,
        toolCalls: toolResults.map((toolResult) => toolResult.name),
    };
}
export async function* streamOperationalChat(message, options = {}) {
    const normalizedMessage = validateMessage(message);
    const llm = options.llm ?? getLlmService();
    const toolExecutor = options.toolExecutor ?? executeOperationalTool;
    const requestId = `chat_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const orchestrationStartedAt = Date.now();
    const toolResults = [];
    logger.info("Streaming orchestration request received", {
        category: "orchestration",
        requestId,
        message: normalizedMessage,
    });
    yield { event: "status", data: { requestId, step: "planning" } };
    const { result: toolPlan, durationMs: planningDurationMs } = await measureAsync(() => llm.generateToolPlan(normalizedMessage, operationalToolSchemas));
    logger.info("Streaming initial tool plan generated", {
        category: "llm",
        operation: "tool_plan",
        requestId,
        durationMs: planningDurationMs,
        tools: toolPlan.toolCalls,
    });
    for (const toolCall of toolPlan.toolCalls) {
        yield { event: "tool_start", data: { requestId, tool: toolCall.name, args: toolCall.args } };
        const { result, durationMs } = await measureAsync(() => toolExecutor(toolCall.name, toolCall.args));
        toolResults.push({ name: toolCall.name, result });
        yield { event: "tool_done", data: { requestId, tool: toolCall.name, durationMs } };
    }
    if (toolResults.length > 0) {
        yield { event: "status", data: { requestId, step: "follow_up_planning" } };
        const { result: followUpPlan, durationMs: followUpDurationMs } = await measureAsync(() => llm.generateFollowUpToolPlan(normalizedMessage, toolResults, operationalToolSchemas));
        logger.info("Streaming follow-up tool plan generated", {
            category: "llm",
            operation: "follow_up_tool_plan",
            requestId,
            durationMs: followUpDurationMs,
            tools: followUpPlan.toolCalls,
        });
        for (const toolCall of followUpPlan.toolCalls) {
            yield { event: "tool_start", data: { requestId, tool: toolCall.name, args: toolCall.args } };
            const { result, durationMs } = await measureAsync(() => toolExecutor(toolCall.name, toolCall.args));
            toolResults.push({ name: toolCall.name, result });
            yield { event: "tool_done", data: { requestId, tool: toolCall.name, durationMs } };
        }
    }
    if (toolResults.length === 0) {
        yield { event: "token", data: { requestId, text: toolPlan.text } };
        yield { event: "done", data: { requestId, durationMs: Date.now() - orchestrationStartedAt } };
        return;
    }
    yield { event: "status", data: { requestId, step: "streaming_summary" } };
    // Retrieve and inject knowledge resources (RAG) for streaming summaries as well.
    try {
        const { result: retrievedResources, durationMs: retrievalDurationMs } = await measureAsync(() => retrieveResourcesForQuery(normalizedMessage));
        if (Array.isArray(retrievedResources) && retrievedResources.length > 0) {
            logger.info("Injecting retrieved knowledge into streaming LLM context", {
                category: "knowledge",
                requestId,
                resources: retrievedResources.map((r) => r.id),
                retrievalDurationMs,
            });
            // Synthesize a knowledge tool result so the existing streaming LLM flow can consume it.
            toolResults.push({ name: "knowledge", result: retrievedResources });
        }
    }
    catch (err) {
        logger.warn("Knowledge retrieval failed for streaming summary", { error: err });
    }
    for await (const chunk of llm.streamSummaryWithToolResults(normalizedMessage, toolResults)) {
        yield { event: "token", data: { requestId, text: chunk } };
    }
    logger.info("Streaming orchestration completed", {
        category: "orchestration",
        requestId,
        durationMs: Date.now() - orchestrationStartedAt,
        toolCalls: toolResults.map((toolResult) => toolResult.name),
    });
    yield { event: "done", data: { requestId, durationMs: Date.now() - orchestrationStartedAt } };
}
//# sourceMappingURL=orchestration.service.js.map