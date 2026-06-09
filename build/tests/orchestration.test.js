import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runOperationalChat } from "../src/services/orchestration.service.js";
describe("AI orchestration", () => {
    it("executes requested tools and asks the LLM to summarize their results", async () => {
        const calls = [];
        const toolExecutor = async (name, args) => {
            calls.push(`${name}:${JSON.stringify(args)}`);
            return {
                tool: name,
                count: 1,
                alerts: [{ asset_id: "248K001B", alert_type: "high_vibration", severity: "critical", value: 9.3 }],
            };
        };
        const llm = {
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
            async generateFollowUpToolPlan() {
                return { text: "", toolCalls: [] };
            },
            async *streamSummaryWithToolResults() {
                yield "";
            },
        };
        const result = await runOperationalChat("Show critical vibration alerts", { llm, toolExecutor });
        assert.deepEqual(calls, ["getCriticalAlerts:{}"]);
        assert.deepEqual(result.toolCalls, ["getCriticalAlerts"]);
        assert.equal(result.response, "248K001B reported a critical high vibration anomaly.");
    });
    it("returns direct LLM text when no tool call is needed", async () => {
        const llm = {
            async generateToolPlan() {
                return {
                    text: "Ask me about assets, alerts, maintenance history, or vibration readings.",
                    toolCalls: [],
                };
            },
            async summarizeWithToolResults() {
                throw new Error("summarization should not run without tool calls");
            },
            async generateFollowUpToolPlan() {
                throw new Error("follow-up planning should not run without initial tool calls");
            },
            async *streamSummaryWithToolResults() {
                yield "";
            },
        };
        const result = await runOperationalChat("What can you do?", { llm });
        assert.equal(result.response, "Ask me about assets, alerts, maintenance history, or vibration readings.");
        assert.deepEqual(result.toolCalls, []);
    });
    it("can chain follow-up tools for maintenance correlation", async () => {
        const calls = [];
        const toolExecutor = async (name, args) => {
            calls.push(`${name}:${JSON.stringify(args)}`);
            if (name === "getCriticalAlerts") {
                return {
                    tool: name,
                    count: 1,
                    alerts: [{ asset_id: "248K001B", alert_type: "high_vibration", severity: "critical", value: 9.3 }],
                };
            }
            return {
                tool: name,
                assetId: "248K001B",
                count: 1,
                maintenanceLogs: [{ asset_id: "248K001B", issue: "bearing wear", action: "bearing replaced" }],
            };
        };
        const llm = {
            async generateToolPlan() {
                return { text: "", toolCalls: [{ name: "getCriticalAlerts", args: { alertType: "high_vibration" } }] };
            },
            async generateFollowUpToolPlan(_message, toolResults) {
                assert.equal(toolResults.length, 1);
                return { text: "", toolCalls: [{ name: "getMaintenanceHistory", args: { assetId: "248K001B" } }] };
            },
            async summarizeWithToolResults(_message, toolResults) {
                assert.equal(toolResults.length, 2);
                return "248K001B has critical vibration anomalies that should be reviewed against prior bearing wear work.";
            },
            async *streamSummaryWithToolResults() {
                yield "";
            },
        };
        const result = await runOperationalChat("Correlate critical vibration alerts with maintenance", {
            llm,
            toolExecutor,
        });
        assert.deepEqual(calls, [
            'getCriticalAlerts:{"alertType":"high_vibration"}',
            'getMaintenanceHistory:{"assetId":"248K001B"}',
        ]);
        assert.deepEqual(result.toolCalls, ["getCriticalAlerts", "getMaintenanceHistory"]);
        assert.match(result.response, /bearing wear/);
    });
});
//# sourceMappingURL=orchestration.test.js.map