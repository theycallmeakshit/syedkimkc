export interface ModelConfig {
  id: string;
  label: string;
  provider: "openai" | "anthropic" | "mock";
  modelName: string;
  enabled: boolean;
  supports_images: boolean;
  envKey: string;
}

export const CONFIGURED_MODELS: ModelConfig[] = [
  {
    id: "openai-gpt-4o-mini",
    label: "OpenAI GPT-4o Mini",
    provider: "openai",
    modelName: "gpt-4o-mini",
    enabled: true,
    supports_images: true,
    envKey: "OPENAI_API_KEY",
  },
  {
    id: "openai-gpt-4o",
    label: "OpenAI GPT-4o",
    provider: "openai",
    modelName: "gpt-4o",
    enabled: true,
    supports_images: true,
    envKey: "OPENAI_API_KEY",
  },
  {
    id: "anthropic-claude-3-5-sonnet",
    label: "Claude 3.5 Sonnet",
    provider: "anthropic",
    modelName: "claude-3-5-sonnet-20241022",
    enabled: true,
    supports_images: true,
    envKey: "ANTHROPIC_API_KEY",
  },
  {
    id: "mock-echo-test",
    label: "Local Test Simulator",
    provider: "mock",
    modelName: "mock-echo",
    enabled: true,
    supports_images: false,
    envKey: "ALLOW_MOCK_PROVIDER",
  },
];

export function getAvailableModels(): Array<{
  id: string;
  label: string;
  supports_images: boolean;
  provider: string;
}> {
  return CONFIGURED_MODELS.filter((m) => {
    if (!m.enabled) return false;
    if (m.provider === "mock") {
      return process.env.ALLOW_MOCK_PROVIDER === "true" || process.env.NODE_ENV === "test";
    }
    const key = process.env[m.envKey];
    return typeof key === "string" && key.trim().length > 0;
  }).map((m) => ({
    id: m.id,
    label: m.label,
    supports_images: m.supports_images,
    provider: m.provider,
  }));
}

export function findModelConfig(modelId: string): ModelConfig | undefined {
  const model = CONFIGURED_MODELS.find((m) => m.id === modelId);
  if (!model || !model.enabled) return undefined;
  if (model.provider === "mock") {
    const isMockAllowed =
      process.env.ALLOW_MOCK_PROVIDER === "true" || process.env.NODE_ENV === "test";
    return isMockAllowed ? model : undefined;
  }
  return model;
}
