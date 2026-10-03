import { AgentKernel } from "./kernel";

async function main() {
  console.log("=== PAA (Personal Autonomous Agent) Kernel Test ===");
  const kernel = new AgentKernel();

  // Listen to character telemetry stream
  kernel.onTelemetry((event) => {
    console.log(`[Companion State: ${event.state.toUpperCase()}] ${event.thought || ""}`);
  });

  const task = {
    id: "task-001",
    prompt: "Write a short summary file about AI agent kernels to test-summary.txt and then confirm.",
    maxSteps: 4,
  };

  console.log(`Starting Task: "${task.prompt}"\n`);
  const result = await kernel.run(task);

  console.log("\n=== Execution Finished ===");
  console.log("Status:", result.status);
  console.log("Steps taken:", result.totalSteps);
  console.log("Duration:", result.durationMs, "ms");
  console.log("Final Response:\n", result.finalResponse);
}

main().catch(console.error);
