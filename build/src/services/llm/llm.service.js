import { env } from "../../config/env.js";
import { createGeminiService } from "./gemini.service.js";
export function getLlmService() {
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
//# sourceMappingURL=llm.service.js.map