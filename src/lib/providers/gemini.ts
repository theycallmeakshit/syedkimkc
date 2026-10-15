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

    const candidateModels = [
      options.model,
      "gemini-flash-lite-latest",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite",
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let lastErrorMessage = "No response received from model.";
    const perAttemptTimeoutMs = Math.min(options.timeoutMs || 8000, 8000);

    for (const modelToCall of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToCall}:generateContent?key=${this.apiKey}`;
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(perAttemptTimeoutMs),
          });

          if (response.ok) {
            const data = await response.json();
            const text =
              data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received from model.";
            return { text };
          }

          const errBody = await response.text();
          let msg = `Gemini request failed with status ${response.status}`;
          try {
            const parsed = JSON.parse(errBody);
            if (parsed?.error?.message) {
              msg = `Gemini: ${parsed.error.message}`;
            }
          } catch {
            // keep default message
          }
          lastErrorMessage = msg;

          // If transient 503 high demand or 429 rate limit, wait 400ms and retry once
          if ((response.status === 503 || response.status === 429) && attempt === 1) {
            await new Promise((r) => setTimeout(r, 400));
            continue;
          }

          // Otherwise move to next candidate model
          break;
        } catch (err: unknown) {
          lastErrorMessage = err instanceof Error ? err.message : "Provider failure";
          // If timed out or failed, try next candidate model
          break;
        }
      }
    }

    throw new Error(lastErrorMessage);
  }
}
