import {
  AgentTask,
  AgentRunSummary,
  AgentState,
  CharacterTelemetryEvent,
  ExecutionStep,
  TelemetryListener,
  ToolContext,
} from "@paa/shared";
import { defaultToolRegistry, ToolRegistry } from "@paa/tools";
import { defaultHybridLLM, HybridLLMClient, ILLMClient, ChatMessage } from "@paa/llm";

export class AgentKernel {
  private toolRegistry: ToolRegistry;
  private llm: ILLMClient;
  private listeners: Set<TelemetryListener> = new Set();

  constructor(
    toolRegistry: ToolRegistry = defaultToolRegistry,
    llm: ILLMClient = defaultHybridLLM
  ) {
    this.toolRegistry = toolRegistry;
    this.llm = llm;

    // Listen to automatic failovers and emit friendly companion telemetry
    if (this.llm instanceof HybridLLMClient) {
      this.llm.onFailover((from, to) => {
        this.emit({
          id: `failover-${Date.now()}`,
          timestamp: Date.now(),
          state: "thinking",
          thought: `Local ${from} offline. Seamlessly switched to ${to} cloud inference!`,
        });
      });
    }
  }

  getLLM(): ILLMClient {
    return this.llm;
  }

  onTelemetry(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: CharacterTelemetryEvent) {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("Telemetry listener error:", err);
      }
    }
  }

  async run(task: AgentTask): Promise<AgentRunSummary> {
    const startTime = Date.now();
    const steps: ExecutionStep[] = [];
    const maxSteps = task.maxSteps || 6;
    const autonomyLevel = task.autonomousLevel ?? 2;

    this.emit({
      id: `${task.id}-init`,
      timestamp: Date.now(),
      state: "thinking",
      thought: `Ingesting task: "${task.prompt}"`,
      progress: 0.05,
    });

    const toolDescriptions = this.toolRegistry.getToolDescriptions();
    const systemPrompt = `You are PAA (Personal Autonomous Agent), an intelligent local employee running on the user's computer.
You have access to tools to accomplish the user's request.

Available Tools:
${toolDescriptions}

At each step, reply STRICTLY in valid JSON with one of these two structures:

1. To call a tool:
{
  "thought": "Your reasoning about what to do next",
  "tool": "tool_name",
  "input": { "key": "value" }
}

2. When the goal is completed:
{
  "thought": "Summary of what was achieved",
  "final_response": "Your full response to the user"
}

Never output anything outside the JSON object.`;

    const conversation: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `User Request: ${task.prompt}` },
    ];

    let currentStep = 0;
    let finalResponse = "";
    let isFinished = false;

    const toolContext: ToolContext = {
      taskId: task.id,
      workingDir: process.cwd(),
      autonomyLevel,
      emitThought: (thought: string) => {
        this.emit({
          id: `${task.id}-thought-${Date.now()}`,
          timestamp: Date.now(),
          state: "thinking",
          thought,
        });
      },
    };

    while (currentStep < maxSteps && !isFinished) {
      currentStep++;
      const stepStart = Date.now();

      this.emit({
        id: `${task.id}-step-${currentStep}`,
        timestamp: Date.now(),
        state: "thinking",
        thought: `Evaluating next action (step ${currentStep}/${maxSteps})...`,
        progress: currentStep / (maxSteps + 1),
      });

      let rawResponse = "";
      try {
        rawResponse = await this.llm.chat(conversation, { format: "json" });
      } catch (err: unknown) {
        const errorMsg = `LLM call failed: ${(err as Error).message}`;
        this.emit({
          id: `${task.id}-err`,
          timestamp: Date.now(),
          state: "error",
          thought: errorMsg,
        });
        return {
          taskId: task.id,
          status: "failed",
          finalResponse: errorMsg,
          totalSteps: currentStep,
          durationMs: Date.now() - startTime,
          steps,
        };
      }

      // Parse JSON
      let parsed: any;
      try {
        parsed = JSON.parse(rawResponse);
      } catch {
        // Fallback cleanup if model wrapped in markdown
        const match = rawResponse.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          parsed = { thought: "Direct response", final_response: rawResponse };
        }
      }

      const thought = parsed.thought || "Thinking...";

      // Check if finished
      if (parsed.final_response) {
        finalResponse = parsed.final_response;
        isFinished = true;
        steps.push({
          stepNumber: currentStep,
          state: "success",
          thought,
          timestamp: Date.now(),
          durationMs: Date.now() - stepStart,
        });
        break;
      }

      // Tool call
      const toolName = parsed.tool;
      const toolInput = parsed.input || {};

      // Determine visual character state from tool type
      let charState: AgentState = "executing";
      if (toolName === "web_search") charState = "searching";
      else if (toolName === "read_file") charState = "reading";
      else if (toolName === "write_file") charState = "coding";

      this.emit({
        id: `${task.id}-tool-${currentStep}`,
        timestamp: Date.now(),
        state: charState,
        thought,
        activeTool: toolName,
        payload: { input: toolInput },
      });

      const toolResult = await this.toolRegistry.execute(toolName, toolInput, toolContext);

      steps.push({
        stepNumber: currentStep,
        state: charState,
        thought,
        action: { tool: toolName, input: toolInput },
        observation: toolResult,
        timestamp: Date.now(),
        durationMs: Date.now() - stepStart,
      });

      // Append assistant decision and observation to conversation
      conversation.push({ role: "assistant", content: JSON.stringify(parsed) });
      conversation.push({
        role: "user",
        content: `Observation from tool "${toolName}": ${JSON.stringify(toolResult)}`,
      });
    }

    if (!isFinished && !finalResponse) {
      finalResponse = "Maximum execution step limit reached without full resolution.";
    }

    this.emit({
      id: `${task.id}-done`,
      timestamp: Date.now(),
      state: "success",
      thought: "Task completed!",
      progress: 1.0,
    });

    return {
      taskId: task.id,
      status: "completed",
      finalResponse,
      totalSteps: currentStep,
      durationMs: Date.now() - startTime,
      steps,
    };
  }
}

export const defaultKernel = new AgentKernel();
