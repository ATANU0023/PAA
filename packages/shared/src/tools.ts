export interface ToolContext {
  taskId: string;
  workingDir: string;
  autonomyLevel: number;
  emitThought: (thought: string) => void;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  requiredPermissionLevel: number; // 0 to 4
  execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult>;
}
