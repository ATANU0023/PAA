import { AgentTool, ToolContext, ToolResult } from "@paa/shared";

export class ToolRegistry {
  private tools: Map<string, AgentTool> = new Map();

  register(tool: AgentTool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  getToolDescriptions(): string {
    return this.getAllTools()
      .map(
        (t) =>
          `- ${t.name}: ${t.description} (Requires Permission Level: ${t.requiredPermissionLevel})`
      )
      .join("\n");
  }

  async execute(
    toolName: string,
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.getTool(toolName);
    if (!tool) {
      return { success: false, error: `Tool "${toolName}" is not registered.` };
    }

    if (context.autonomyLevel < tool.requiredPermissionLevel) {
      return {
        success: false,
        error: `Permission Denied: Tool "${toolName}" requires level ${tool.requiredPermissionLevel}, but current task is at level ${context.autonomyLevel}.`,
      };
    }

    try {
      return await tool.execute(input, context);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `Tool execution failed: ${msg}` };
    }
  }
}

export const defaultToolRegistry = new ToolRegistry();
