import { ChatMessage, ILLMClient, LLMGenerateOptions } from "./types";

export class OllamaClient implements ILLMClient {
  private baseUrl: string;
  private defaultModel: string;

  constructor(
    baseUrl: string = process.env.OLLAMA_HOST || "http://127.0.0.1:11434",
    defaultModel: string = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b"
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.defaultModel = defaultModel;
  }

  getProviderName(): string {
    return "Ollama (Local)";
  }

  getActiveModel(): string {
    return this.defaultModel;
  }

  setModel(model: string) {
    this.defaultModel = model;
  }

  /**
   * Check if local Ollama daemon is reachable.
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout ? AbortSignal.timeout(2000) : undefined,
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Send a chat completion request to the local model.
   */
  async chat(messages: ChatMessage[], options: LLMGenerateOptions = {}): Promise<string> {
    const model = options.model || this.defaultModel;
    const body: Record<string, unknown> = {
      model,
      messages,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.2,
      },
    };

    if (options.format === "json") {
      body.format = "json";
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Ollama request failed (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.message?.content || "";
  }
}

export const defaultOllama = new OllamaClient();
