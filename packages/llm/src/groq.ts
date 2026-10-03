import { ChatMessage, ILLMClient, LLMGenerateOptions } from "./types";

export class GroqClient implements ILLMClient {
  private apiKey: string;
  private defaultModel: string;
  private baseUrl: string;

  constructor(
    apiKey: string = process.env.GROQ_API_KEY || "",
    defaultModel: string = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
  ) {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.baseUrl = "https://api.groq.com/openai/v1";
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  getProviderName(): string {
    return "Groq";
  }

  getActiveModel(): string {
    return this.defaultModel;
  }

  async isHealthy(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async chat(messages: ChatMessage[], options: LLMGenerateOptions = {}): Promise<string> {
    const key = this.apiKey || process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error(
        "Groq API Key is missing. Set GROQ_API_KEY in your environment or configure it in the PAA settings."
      );
    }

    const model = options.model || this.defaultModel;
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: options.temperature ?? 0.2,
    };

    if (options.format === "json") {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

export const defaultGroq = new GroqClient();
