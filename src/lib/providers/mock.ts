import { GenerateOptions, GenerateResult, ProviderAdapter } from "./types";

export class MockProviderAdapter implements ProviderAdapter {
  static lastGenerateOptions?: GenerateOptions;

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    MockProviderAdapter.lastGenerateOptions = options;
    const userMsg = options.messages.filter((m) => m.role === "user").pop();
    const promptText = userMsg ? userMsg.content : "";

    // Simulate standard model response confirming receipt of sanitized context
    if (promptText.includes("[PAN_") || promptText.includes("[PHONE_") || promptText.includes("[EMAIL_")) {
      return {
        text: `Processed query with masked tokens. Verified enterprise context received: ${promptText.slice(0, 120)}...`,
      };
    }

    if (promptText.includes("ENTERPRISE CONTEXT")) {
      return {
        text: `Consulted enterprise knowledge base. Provided response based on authorized document context: ${promptText.slice(0, 150)}...`,
      };
    }

    return {
      text: `Aegis Guard validated request. Upstream model [${options.model}] completed processing: "${promptText.slice(0, 80)}"`,
    };
  }
}
