export type AgentState =
  | "idle"
  | "thinking"
  | "searching"
  | "reading"
  | "coding"
  | "executing"
  | "waiting"
  | "success"
  | "error";

export interface CharacterTelemetryEvent {
  id: string;
  timestamp: number;
  state: AgentState;
  thought?: string;
  activeTool?: string;
  progress?: number;
  payload?: Record<string, unknown>;
}
