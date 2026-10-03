import express, { Request, Response } from "express";
import cors from "cors";
import { AgentKernel } from "@paa/agent-kernel";
import { CharacterTelemetryEvent } from "@paa/shared";

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const kernel = new AgentKernel();
const sseClients: Response[] = [];

// Broadcast telemetry event to all connected UI clients (desktop widget, character HUD)
kernel.onTelemetry((event: CharacterTelemetryEvent) => {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    client.write(data);
  }
});

// SSE endpoint for Character and UI Telemetry
app.get("/api/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send initial idle state
  res.write(`data: ${JSON.stringify({ state: "idle", thought: "Companion online and ready." })}\n\n`);

  sseClients.push(res);
  req.on("close", () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// Run a task through the autonomous agent
app.post("/api/task", async (req: Request, res: Response) => {
  const { prompt, maxSteps, autonomyLevel } = req.body;
  if (!prompt) {
    res.status(400).json({ error: "Missing 'prompt' in request body." });
    return;
  }

  const taskId = `task-${Date.now()}`;
  try {
    const result = await kernel.run({
      id: taskId,
      prompt,
      maxSteps: maxSteps || 6,
      autonomousLevel: autonomyLevel ?? 2,
    });
    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "healthy", agent: "PAA Kernel v0.1" });
});

// Get current LLM Provider Status & Health
app.get("/api/llm/status", async (_req: Request, res: Response) => {
  const llm = kernel.getLLM();
  const provider = llm.getProviderName();
  const model = llm.getActiveModel();
  const isHealthy = await llm.isHealthy();
  res.json({ provider, model, isHealthy });
});

// Configure Groq Key or force provider
app.post("/api/llm/config", (req: Request, res: Response) => {
  const { groqApiKey, forceProvider } = req.body;
  const llm = kernel.getLLM();
  if ("setGroqApiKey" in llm && typeof (llm as any).setGroqApiKey === "function" && groqApiKey) {
    (llm as any).setGroqApiKey(groqApiKey);
  }
  if ("setForceProvider" in llm && typeof (llm as any).setForceProvider === "function") {
    (llm as any).setForceProvider(forceProvider);
  }
  res.json({ success: true, provider: llm.getProviderName() });
});

app.listen(port, () => {
  console.log(`[PAA API] Agent Kernel Server listening at http://localhost:${port}`);
  console.log(`[PAA API] Live SSE stream available at http://localhost:${port}/api/stream`);
});
