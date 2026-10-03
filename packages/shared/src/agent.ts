import { AgentState } from "./events";

export interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
}

export interface ExecutionStep {
  stepNumber: number;
  state: AgentState;
  thought: string;
  action?: ToolCall;
  observation?: unknown;
  timestamp: number;
  durationMs?: number;
}

export interface AgentTask {
  id: string;
  prompt: string;
  maxSteps?: number;
  autonomousLevel?: number; // 0: Observe, 1: Suggest, 2: Safe Execute, 3: External, 4: Sensitive
  metadata?: Record<string, unknown>;
}

export interface AgentRunSummary {
  taskId: string;
  status: "completed" | "failed" | "interrupted" | "waiting_approval";
  finalResponse: string;
  totalSteps: number;
  durationMs: number;
  steps: ExecutionStep[];
}
