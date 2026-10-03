import { AgentTool, ToolContext, ToolResult } from "@paa/shared";

export const webSearchTool: AgentTool = {
  name: "web_search",
  description: "Search the web for technical documentation, news, or articles.",
  requiredPermissionLevel: 0, // Safe read
  async execute(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const query = String(input.query || "");
    if (!query) {
      return { success: false, error: "Missing 'query' argument." };
    }
    context.emitThought(`Searching the web for "${query}"...`);

    // Basic DuckDuckGo Instant Answer / HTML search or structured fallback
    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PAA-Bot/1.0" },
      });
      const html = await response.text();
      // Extract brief snippets
      const snippetMatches = html.match(/<a class="result__snippet[^>]*>(.*?)<\/a>/g) || [];
      const snippets = snippetMatches
        .slice(0, 5)
        .map((s) => s.replace(/<[^>]+>/g, "").trim());

      return {
        success: true,
        data: {
          query,
          resultsCount: snippets.length,
          snippets: snippets.length > 0 ? snippets : ["No immediate snippet found. Try refined query."],
        },
      };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  },
};
