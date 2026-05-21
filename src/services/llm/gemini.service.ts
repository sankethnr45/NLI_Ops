import { env } from "../../config/env.js";
import { isOperationalToolName, type ToolCall, type ToolSchema } from "../../tools/tool-registry.js";
import type { LlmService, ToolPlan, ToolResult } from "./llm.service.js";

interface GeminiFunctionCall {
  name: string;
  args?: Record<string, unknown>;
}

interface GeminiPart {
  text?: string;
  functionCall?: GeminiFunctionCall;
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

interface GeminiContent {
  role?: "user" | "model" | "function";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: GeminiContent;
  }>;
}

const systemInstruction = `
You are an operational intelligence assistant for industrial assets.
Use tools for operational data. Do not invent asset status, alerts, telemetry, or maintenance history.
When tool results are available, summarize them clearly for a plant operations user.
Focus on anomaly interpretation, recurring issues, maintenance correlation, likely operational impact, and practical next checks.
`;

const summaryInstruction = `
Summarize these backend tool results for an operations user.
Do not merely count records. Explain what the results mean operationally.
Look for repeated asset IDs, recurring alert types, high telemetry values, asset health/status, and maintenance issues such as bearing wear, seal leaks, overheating, or inspection history.
If alert/telemetry and maintenance results point to the same asset, explicitly call out the possible correlation.
Keep the answer concise, cite asset IDs, and avoid inventing facts not present in the tool results.
`;

function assertGeminiConfigured() {
  if (!env.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is required when LLM_PROVIDER=gemini.");
  }
}

function toGeminiToolDeclarations(tools: ToolSchema[]) {
  return [
    {
      functionDeclarations: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
    },
  ];
}

function readResponseText(response: GeminiResponse): string {
  return response.candidates?.[0]?.content?.parts.map((part) => part.text ?? "").join("").trim() ?? "";
}

function readToolCalls(response: GeminiResponse): ToolCall[] {
  const parts = response.candidates?.[0]?.content?.parts ?? [];

  return parts
    .filter((part) => part.functionCall && isOperationalToolName(part.functionCall.name))
    .map((part) => ({
      name: part.functionCall?.name as ToolCall["name"],
      args: part.functionCall?.args ?? {},
    }));
}

async function callGemini(contents: GeminiContent[], tools?: ReturnType<typeof toGeminiToolDeclarations>) {
  assertGeminiConfigured();

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents,
      tools,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Gemini request failed with ${response.status} for model "${env.geminiModel}". ` +
        `If this is a model lookup error, set GEMINI_MODEL=gemini-2.5-flash or list models for your API key. ` +
        errorBody,
    );
  }

  return (await response.json()) as GeminiResponse;
}

async function* streamGemini(contents: GeminiContent[]): AsyncIterable<GeminiResponse> {
  assertGeminiConfigured();

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}` +
    `:streamGenerateContent?alt=sse&key=${env.geminiApiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini streaming request failed with ${response.status} for model "${env.geminiModel}". ${errorBody}`);
  }

  if (!response.body) {
    throw new Error("Gemini streaming response did not include a response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      const data = event
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice("data:".length).trim())
        .join("\n");

      if (!data || data === "[DONE]") {
        continue;
      }

      yield JSON.parse(data) as GeminiResponse;
    }
  }
}

function buildToolResultParts(message: string, toolResults: ToolResult[]): GeminiContent[] {
  return [
    {
      role: "user",
      parts: [{ text: message }],
    },
    {
      role: "user",
      parts: [
        { text: summaryInstruction },
        {
          text: JSON.stringify(
            toolResults.map((toolResult) => ({
              tool: toolResult.name,
              result: toolResult.result,
            })),
          ),
        },
        ...toolResults.map((toolResult) => ({
          functionResponse: {
            name: toolResult.name,
            response: {
              result: toolResult.result,
            },
          },
        })),
      ],
    },
  ];
}

export function createGeminiService(): LlmService {
  return {
    async generateToolPlan(message: string, tools: ToolSchema[]): Promise<ToolPlan> {
      const response = await callGemini(
        [
          {
            role: "user",
            parts: [{ text: message }],
          },
        ],
        toGeminiToolDeclarations(tools),
      );

      return {
        text: readResponseText(response),
        toolCalls: readToolCalls(response),
      };
    },

    async summarizeWithToolResults(message: string, toolResults: ToolResult[]): Promise<string> {
      const contents = buildToolResultParts(message, toolResults);

      const response = await callGemini(contents);
      const text = readResponseText(response);

      return text || "I found operational data, but Gemini did not return a summary.";
    },

    async generateFollowUpToolPlan(message: string, toolResults: ToolResult[], tools: ToolSchema[]): Promise<ToolPlan> {
      const response = await callGemini(
        [
          {
            role: "user",
            parts: [
              {
                text:
                  "Review the user question and backend tool results. If one more tool batch would improve operational correlation, call those tools now. Prefer maintenance history for assets with vibration or overheating anomalies. If no more data is needed, return plain text saying no follow-up tools are needed.",
              },
              { text: message },
              {
                text: JSON.stringify(
                  toolResults.map((toolResult) => ({
                    tool: toolResult.name,
                    result: toolResult.result,
                  })),
                ),
              },
            ],
          },
        ],
        toGeminiToolDeclarations(tools),
      );

      return {
        text: readResponseText(response),
        toolCalls: readToolCalls(response),
      };
    },

    async *streamSummaryWithToolResults(message: string, toolResults: ToolResult[]): AsyncIterable<string> {
      const contents = buildToolResultParts(message, toolResults);

      for await (const response of streamGemini(contents)) {
        const text = readResponseText(response);

        if (text) {
          yield text;
        }
      }
    },
  };
}
