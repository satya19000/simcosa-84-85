import { config } from "../../config.js";
import { AnthropicLlmProvider } from "./anthropic.js";
import { MockLlmProvider } from "./mock.js";
import type { LlmProvider } from "./types.js";

export * from "./types.js";

let provider: LlmProvider | undefined;

export function getLlmProvider(): LlmProvider {
  if (!provider) provider = config.LLM_PROVIDER === "anthropic" ? new AnthropicLlmProvider() : new MockLlmProvider();
  return provider;
}
