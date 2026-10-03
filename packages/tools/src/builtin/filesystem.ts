import * as fs from "fs/promises";
import * as path from "path";
import { AgentTool, ToolContext, ToolResult } from "@paa/shared";

export const readFileTool: AgentTool = {
  name: "read_file",
  description: "Read the contents of a local file safely.",
  requiredPermissionLevel: 0, // Safe read
  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const filePath = String(input.path || "");
    if (!filePath) {
      return { success: false, error: "Missing 'path' argument." };
    }
    try {
      const content = await fs.readFile(filePath, "utf-8");
      return { success: true, data: { content, path: filePath, bytes: content.length } };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
};

export const writeFileTool: AgentTool = {
  name: "write_file",
  description: "Write content to a file. Overwrites if exists.",
  requiredPermissionLevel: 2, // Safe execute
  async execute(input: Record<string, unknown>, _context: ToolContext): Promise<ToolResult> {
    const filePath = String(input.path || "");
    const content = String(input.content || "");
    if (!filePath) {
      return { success: false, error: "Missing 'path' argument." };
    }
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, "utf-8");
      return { success: true, data: { path: filePath, bytesWritten: content.length } };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
};
