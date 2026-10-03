export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMGenerateOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  format?: "json" | "";
}

export interface ILLMClient {
  chat(messages: ChatMessage[], options?: LLMGenerateOptions): Promise<string>;
  isHealthy(): Promise<boolean>;
  getProviderName(): string;
  getActiveModel(): string;
}
