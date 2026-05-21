import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runOperationalChat, type ToolExecutor } from "../src/services/orchestration.service.js";
import type { LlmService } from "../src/services/llm/llm.service.js";

describe("AI orchestration", () => {
  it("executes requested tools and asks the LLM to summarize their results", async () => {
    const calls: string[] = [];
    const toolExecutor: ToolExecutor = async (name, args) => {
      calls.push(`${name}:${JSON.stringify(args)}`);
      return {
        tool: name,
        count: 1,
        alerts: [{ asset_id: "248K001B", alert_type: "high_vibration", severity: "critical", value: 9.3 }],
      };
    };

    const llm: LlmService = {
      async generateToolPlan() {
        return {
          text: "",
          toolCalls: [{ name: "getCriticalAlerts", args: {} }],
        };
      },
      async summarizeWithToolResults(_message, toolResults) {
        assert.equal(toolResults.length, 1);
        assert.equal(toolResults[0]?.name, "getCriticalAlerts");
        return "248K001B reported a critical high vibration anomaly.";
      },
    };

    const result = await runOperationalChat("Show critical vibration alerts", { llm, toolExecutor });

    assert.deepEqual(calls, ["getCriticalAlerts:{}"]);
    assert.deepEqual(result.toolCalls, ["getCriticalAlerts"]);
    assert.equal(result.response, "248K001B reported a critical high vibration anomaly.");
  });

  it("returns direct LLM text when no tool call is needed", async () => {
    const llm: LlmService = {
      async generateToolPlan() {
        return {
          text: "Ask me about assets, alerts, maintenance history, or vibration readings.",
          toolCalls: [],
        };
      },
      async summarizeWithToolResults() {
        throw new Error("summarization should not run without tool calls");
      },
    };

    const result = await runOperationalChat("What can you do?", { llm });

    assert.equal(result.response, "Ask me about assets, alerts, maintenance history, or vibration readings.");
    assert.deepEqual(result.toolCalls, []);
  });
});
