import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Singleton factory for initializing LLM instances.
 * Supports configurable model names via GEMINI_MODEL or OPENAI_MODEL environment variables.
 */
export function getLLMModel(options?: { temperature?: number; modelName?: string }): BaseChatModel {
  const temperature = options?.temperature ?? 0.2;

  const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const defaultGeminiModel = process.env.GEMINI_MODEL || options?.modelName || "gemini-2.5-flash";
  const defaultOpenAIModel = process.env.OPENAI_MODEL || options?.modelName || "gpt-4o-mini";

  if (geminiApiKey) {
    return new ChatGoogleGenerativeAI({
      apiKey: geminiApiKey,
      model: defaultGeminiModel,
      temperature,
      maxOutputTokens: 8192,
    });
  }

  if (openaiApiKey) {
    return new ChatOpenAI({
      apiKey: openaiApiKey,
      model: defaultOpenAIModel,
      temperature,
      maxTokens: 8192,
    });
  }

  console.warn(
    "[LLM Factory] Neither GOOGLE_GENERATIVE_AI_API_KEY/GEMINI_API_KEY nor OPENAI_API_KEY was found in environment variables. Falling back to default Gemini config."
  );

  return new ChatGoogleGenerativeAI({
    model: defaultGeminiModel,
    temperature,
    maxOutputTokens: 8192,
  });
}
