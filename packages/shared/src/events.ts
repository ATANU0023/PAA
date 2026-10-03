/**
 * Character and Agent Lifecycle State
 * Used by Desktop Companion to trigger animations, facial expressions, and balloon text.
 */
export type AgentState =
  | "idle"        // Resting, breathing animation
  | "thinking"    // Analyzing, pondering next step
  | "searching"   // Web search active, looking around
  | "reading"     // Processing documents or web page text
  | "coding"      // Writing code or editing files
  | "executing"   // Running shell command or local tool
  | "waiting"     // Waiting for user confirmation / permission
  | "success"     // Task completed successfully
  | "error";      // Encountered error or obstacle

export interface CharacterTelemetryEvent {
  id: string;
  timestamp: number;
  state: AgentState;
  thought?: string;
  activeTool?: string;
  progress?: number; // 0.0 to 1.0
  payload?: Record<string, unknown>;
}

export type TelemetryListener = (event: CharacterTelemetryEvent) => void;
