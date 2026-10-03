import { defaultToolRegistry } from "./registry";
import { readFileTool, writeFileTool } from "./builtin/filesystem";
import { webSearchTool } from "./builtin/web-search";

defaultToolRegistry.register(readFileTool);
defaultToolRegistry.register(writeFileTool);
defaultToolRegistry.register(webSearchTool);

export * from "./registry";
export * from "./builtin/filesystem";
export * from "./builtin/web-search";
