import { findModelConfig } from "../../config/providers";
import { AnthropicAdapter } from "./anthropic";
import { MockProviderAdapter } from "./mock";
import { OpenAiAdapter } from "./openai";
import { ProviderAdapter } from "./types";

export function getProviderAdapter(modelId: string): { adapter: ProviderAdapter; modelName: string } {
  const config = findModelConfig(modelId);
  if (!config) {
    throw new Error(`Model '${modelId}' is not configured or enabled on the server.`);
  }

  switch (config.provider) {
    case "openai":
      return { adapter: new OpenAiAdapter(), modelName: config.modelName };
    case "anthropic":
      return { adapter: new AnthropicAdapter(), modelName: config.modelName };
    case "mock":
      return { adapter: new MockProviderAdapter(), modelName: config.modelName };
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
