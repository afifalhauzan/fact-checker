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
      // Gemini 2.5 models spend part of maxOutputTokens on internal "thinking" by default,
      // which can starve the actual JSON answer and cause truncated/unparsable structured output
      // (especially with image input, which increases thinking usage). Disable it since we don't
      // need chain-of-thought here — the schema's own "reasoning" field already covers that.
      thinkingConfig: { thinkingBudget: 0 },
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
    thinkingConfig: { thinkingBudget: 0 },
  });
}
