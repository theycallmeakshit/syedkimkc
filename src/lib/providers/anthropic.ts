import { GenerateOptions, GenerateResult, ProviderAdapter } from "./types";

export class AnthropicAdapter implements ProviderAdapter {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || "";
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    if (!this.apiKey) {
      throw new Error("Anthropic API key is not configured on the server.");
    }

    const systemMsg = options.messages.find((m) => m.role === "system");
    const nonSystemMessages = options.messages.filter((m) => m.role !== "system");

    const formattedMessages = nonSystemMessages.map((m) => {
      if (m.imageBase64 && m.role === "user") {
        const cleanBase64 = m.imageBase64.includes(",")
          ? m.imageBase64.split(",")[1]
          : m.imageBase64;
        return {
          role: m.role,
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: cleanBase64,
              },
            },
            { type: "text", text: m.content },
          ],
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 25000);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: options.model,
          system: systemMsg?.content,
          messages: formattedMessages,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text();
        let message = `Anthropic request failed with status ${response.status}`;
        try {
          const parsed = JSON.parse(errBody);
          if (parsed?.error?.message) {
            message = `Anthropic: ${parsed.error.message}`;
          }
        } catch {
          // keep generic message
        }
        throw new Error(message);
      }

      const data = await response.json();
      const textBlock = data.content?.find((c: { type: string; text?: string }) => c.type === "text");
      return { text: textBlock?.text || "" };
    } finally {
      clearTimeout(timeout);
    }
  }
}
