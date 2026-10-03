import { ChatMessage, ILLMClient, LLMGenerateOptions } from "./types";
import { OllamaClient, defaultOllama } from "./ollama";
import { GroqClient, defaultGroq } from "./groq";

export type FailoverListener = (from: string, to: string, reason: string) => void;

export class HybridLLMClient implements ILLMClient {
  private ollama: OllamaClient;
  private groq: GroqClient;
  private forceProvider?: "ollama" | "groq";
  private listeners: Set<FailoverListener> = new Set();

  constructor(
    ollama: OllamaClient = defaultOllama,
    groq: GroqClient = defaultGroq,
    forceProvider?: "ollama" | "groq"
  ) {
    this.ollama = ollama;
    this.groq = groq;
    this.forceProvider = forceProvider;
  }

  onFailover(cb: FailoverListener): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  setGroqApiKey(key: string) {
    this.groq.setApiKey(key);
  }

  setForceProvider(provider?: "ollama" | "groq") {
    this.forceProvider = provider;
  }

  getProviderName(): string {
    if (this.forceProvider === "groq") return "Groq Cloud (Enforced)";
    if (this.forceProvider === "ollama") return "Ollama Local (Enforced)";
    return "Hybrid (Ollama -> Groq Fallback)";
  }

  getActiveModel(): string {
    if (this.forceProvider === "groq") return this.groq.getActiveModel();
    return this.ollama.getActiveModel();
  }

  async isHealthy(): Promise<boolean> {
    const [ollamaOk, groqOk] = await Promise.all([this.ollama.isHealthy(), this.groq.isHealthy()]);
    return ollamaOk || groqOk;
  }

  async getHealthStatus(): Promise<{ ollama: boolean; groq: boolean }> {
    const [ollama, groq] = await Promise.all([this.ollama.isHealthy(), this.groq.isHealthy()]);
    return { ollama, groq };
  }

  async chat(messages: ChatMessage[], options: LLMGenerateOptions = {}): Promise<string> {
    // If user explicitly forced Groq
    if (this.forceProvider === "groq") {
      return await this.groq.chat(messages, options);
    }

    // If user explicitly forced Ollama
    if (this.forceProvider === "ollama") {
      return await this.ollama.chat(messages, options);
    }

    // Default: Try Local Ollama First
    try {
      return await this.ollama.chat(messages, options);
    } catch (ollamaError: unknown) {
      const reason = (ollamaError as Error).message;
      console.warn(`[PAA LLM] Local Ollama failed (${reason}). Triggering fallback to Groq...`);

      // Notify failover listeners
      for (const listener of this.listeners) {
        try {
          listener("Ollama (Local)", "Groq (Cloud)", reason);
        } catch {
          // ignore
        }
      }

      // Seamless Failover to Groq
      try {
        return await this.groq.chat(messages, options);
      } catch (groqError: unknown) {
        throw new Error(
          `All AI models failed.\nLocal Ollama Error: ${reason}\nGroq Cloud Fallback Error: ${(groqError as Error).message}`
        );
      }
    }
  }
}

export const defaultHybridLLM = new HybridLLMClient();
