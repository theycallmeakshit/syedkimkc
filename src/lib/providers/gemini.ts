import { GenerateOptions, GenerateResult, ProviderAdapter } from "./types";

export class GeminiAdapter implements ProviderAdapter {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
  }

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    if (!this.apiKey) {
      throw new Error("Gemini API key is not configured on the server.");
    }

    const systemMsg = options.messages.find((m) => m.role === "system");
    const userMsg = options.messages.filter((m) => m.role === "user").pop();

    const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];

    if (userMsg?.content) {
      parts.push({ text: userMsg.content });
    }

    if (userMsg?.imageBase64) {
      let b64 = userMsg.imageBase64;
      let mimeType = "image/jpeg";
      if (b64.startsWith("data:")) {
        const colonIdx = b64.indexOf(":");
        const semiIdx = b64.indexOf(";");
        if (colonIdx !== -1 && semiIdx !== -1) {
          mimeType = b64.substring(colonIdx + 1, semiIdx);
        }
        b64 = b64.split(",")[1] || b64;
      }
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: b64,
        },
      });
    }

    const payload: Record<string, unknown> = {
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    };

    if (systemMsg?.content) {
      payload.system_instruction = {
        parts: [{ text: systemMsg.content }],
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 25000);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await response.text();
        let message = `Gemini request failed with status ${response.status}`;
        try {
          const parsed = JSON.parse(errBody);
          if (parsed?.error?.message) {
            message = `Gemini: ${parsed.error.message}`;
          }
        } catch {
          // keep generic message
        }
        throw new Error(message);
      }

      const data = await response.json();
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received from model.";
      return { text };
    } finally {
      clearTimeout(timeout);
    }
  }
}
