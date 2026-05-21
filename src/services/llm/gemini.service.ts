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
      const contents: GeminiContent[] = [
        {
          role: "user",
          parts: [{ text: message }],
        },
        {
          role: "user",
          parts: [
            {
              text:
                "Summarize these backend tool results for an operations user. Keep it concise and cite asset IDs when available.",
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

      const response = await callGemini(contents);
      const text = readResponseText(response);

      return text || "I found operational data, but Gemini did not return a summary.";
    },
  };
}
