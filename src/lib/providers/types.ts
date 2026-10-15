export interface ProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
  imageBase64?: string;
}

export interface GenerateOptions {
  messages: ProviderMessage[];
  model: string;
  timeoutMs?: number;
}

export interface GenerateResult {
  text: string;
}

export interface ProviderAdapter {
  generate(options: GenerateOptions): Promise<GenerateResult>;
}
