import { GenerateOptions, GenerateResult, ProviderAdapter } from "./types";

export class OpenAiAdapter implements ProviderAdapter {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is not configured on the server.");
    }

    const formattedMessages = options.messages.map((m) => {
      if (m.imageBase64 && m.role === "user") {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content },
            {
              type: "image_url",
              image_url: {
                url: m.imageBase64.startsWith("data:")
                  ? m.imageBase64
                  : `data:image/jpeg;base64,${m.imageBase64}`,
              },
            },
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
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options.model,
          messages: formattedMessages,
          temperature: 0.2,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text();
        let message = `OpenAI request failed with status ${response.status}`;
        try {
          const parsed = JSON.parse(errBody);
          if (parsed?.error?.message) {
            message = `OpenAI: ${parsed.error.message}`;
          }
        } catch {
          // keep generic message
        }
        throw new Error(message);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      return { text };
    } finally {
      clearTimeout(timeout);
    }
  }
}
