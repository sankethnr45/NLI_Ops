import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 3000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017",
  mongoDatabaseName: process.env.MONGODB_DB_NAME ?? process.env.DB_NAME ?? "nli_ops_assistant",
  llmProvider: process.env.LLM_PROVIDER ?? "gemini",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
};
