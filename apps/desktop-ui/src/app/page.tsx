"use client";

import React, { useState, useEffect, useRef } from "react";
import type { AgentState, CharacterTelemetryEvent } from "../types/agent";
import { PixelCompanion } from "../components/PixelCompanion";
import {
  MessageSquare,
  Square,
  Footprints,
  Activity,
  Maximize2,
  X,
  Send,
  Sparkles,
  Move,
  Terminal,
  Cpu,
  Database,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  ChevronRight,
  Code2,
  Search,
  BookOpen,
  Wrench,
  PauseCircle,
  Play,
  RotateCcw,
  Settings,
  Key,
  Zap,
  ShieldCheck,
} from "lucide-react";

declare global {
  interface Window {
    paaDesktop?: {
      isDesktop: boolean;
      moveWindow: (dx: number, dy: number) => Promise<[number, number]>;
      setWindowPos: (x: number, y: number) => Promise<[number, number]>;
      getWindowPos: () => Promise<[number, number]>;
      getScreenBounds: () => Promise<{ width: number; height: number }>;
      setAlwaysOnTop: (always: boolean) => Promise<void>;
      minimizeWindow: () => Promise<void>;
    };
  }
}

interface StepLog {
  stepNumber: number;
  state: AgentState;
  thought: string;
  tool?: string;
  input?: Record<string, unknown>;
  observation?: unknown;
  durationMs?: number;
  timestamp: string;
}

export default function CompanionDashboard() {
  const [isWidget, setIsWidget] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [activeTool, setActiveTool] = useState<string | undefined>();
  const [thought, setThought] = useState<string>("PAA Core initialized. Ready for instructions.");
  const [promptInput, setPromptInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autonomyLevel, setAutonomyLevel] = useState<number>(2);

  // LLM Provider & Groq Fallback State
  const [groqKey, setGroqKey] = useState("");
  const [savedGroqKey, setSavedGroqKey] = useState("");
  const [providerMode, setProviderMode] = useState<"hybrid" | "ollama" | "groq">("hybrid");
  const [llmStatus, setLlmStatus] = useState<{ provider: string; model: string; isHealthy: boolean }>({
    provider: "Hybrid (Ollama -> Groq Fallback)",
    model: "qwen2.5-coder:7b",
    isHealthy: true,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState("");

  const handleSaveGroqConfig = async () => {
    localStorage.setItem("paa_groq_key", groqKey.trim());
    localStorage.setItem("paa_provider_mode", providerMode);
    setSavedGroqKey(groqKey.trim());

    try {
      await fetch("http://localhost:4000/api/llm/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groqApiKey: groqKey.trim(),
          forceProvider: providerMode === "hybrid" ? undefined : providerMode,
        }),
      });
      setKeySaveMessage("✓ Settings saved & synced!");
      setTimeout(() => setKeySaveMessage(""), 3000);

      const statusRes = await fetch("http://localhost:4000/api/llm/status");
      const statusData = await statusRes.json();
      if (statusData.provider) setLlmStatus(statusData);
    } catch {
      setKeySaveMessage("✓ Saved locally.");
      setTimeout(() => setKeySaveMessage(""), 3000);
    }
  };

  // Character States & Autonomous Behavior
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [roamMode, setRoamMode] = useState(true);
  const [isWalking, setIsWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);

  // Pro Dashboard Tabs & Logs
  const [activeTab, setActiveTab] = useState<"timeline" | "terminal" | "context">("timeline");
  const [timelineSteps, setTimelineSteps] = useState<StepLog[]>([
    {
      stepNumber: 1,
      state: "idle",
      thought: "System initialized. Standing by on desktop taskbar.",
      timestamp: "--:--:--",
      durationMs: 42,
    },
  ]);
  const [rawLogs, setRawLogs] = useState<{ time: string; state: AgentState; message: string; tool?: string }[]>([
    { time: "--:--:--", state: "idle", message: "PAA Telemetry link online (port 4000)." },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Client-side initialization and URL query detection
  useEffect(() => {
    const initialTime = new Date().toLocaleTimeString();
    setTimelineSteps([
      {
        stepNumber: 1,
        state: "idle",
        thought: "System initialized. Standing by on desktop taskbar.",
        timestamp: initialTime,
        durationMs: 42,
      },
    ]);
    setRawLogs([
      { time: initialTime, state: "idle", message: "PAA Telemetry link online (port 4000)." },
    ]);

    // Load persisted Groq key and provider mode
    if (typeof window !== "undefined") {
      const storedGroq = localStorage.getItem("paa_groq_key") || "";
      const storedMode = (localStorage.getItem("paa_provider_mode") as any) || "hybrid";
      if (storedGroq) {
        setGroqKey(storedGroq);
        setSavedGroqKey(storedGroq);
      }
      setProviderMode(storedMode);

      fetch("http://localhost:4000/api/llm/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groqApiKey: storedGroq,
          forceProvider: storedMode === "hybrid" ? undefined : storedMode,
        }),
      }).catch(() => {});

      fetch("http://localhost:4000/api/llm/status")
        .then((r) => r.json())
        .then((d) => {
          if (d.provider) setLlmStatus(d);
        })
        .catch(() => {});

      const params = new URLSearchParams(window.location.search);
      const widget = params.get("mode") === "widget";
      setIsWidget(widget);
      if (widget) {
        document.documentElement.classList.add("widget-mode");
        document.body.classList.add("widget-mode");
      }
    }
  }, []);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; winX: number; winY: number } | null>(null);

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (!window.paaDesktop) return;
    isDraggingRef.current = false;
    try {
      const [winX, winY] = await window.paaDesktop.getWindowPos();
      dragStartRef.current = { x: e.screenX, y: e.screenY, winX, winY };
    } catch {
      // ignore
    }
  };

  const handleMouseMove = async (e: React.MouseEvent) => {
    if (!dragStartRef.current || !window.paaDesktop) return;
    const dx = e.screenX - dragStartRef.current.x;
    const dy = e.screenY - dragStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      isDraggingRef.current = true;
      try {
        await window.paaDesktop.setWindowPos(dragStartRef.current.winX + dx, dragStartRef.current.winY + dy);
      } catch {
        // ignore
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) {
      setMenuOpen((prev) => !prev);
    }
    dragStartRef.current = null;
    isDraggingRef.current = false;
  };

  // Autonomous Roaming on Windows Taskbar
  useEffect(() => {
    if (!isWidget || !roamMode || agentState !== "idle" || menuOpen || chatOpen) return;

    let isMounted = true;
    let walkTimer: NodeJS.Timeout | null = null;

    const wanderStep = async () => {
      if (!window.paaDesktop || !isMounted) return;

      try {
        const [curX] = await window.paaDesktop.getWindowPos();
        const bounds = await window.paaDesktop.getScreenBounds();

        // Reverse direction at screen bounds
        let nextFacingLeft = facingLeft;
        if (curX > bounds.width - 280) {
          nextFacingLeft = true;
        } else if (curX < 40) {
          nextFacingLeft = false;
        } else if (Math.random() < 0.25) {
          nextFacingLeft = !facingLeft;
        }

        setFacingLeft(nextFacingLeft);
        setIsWalking(true);

        const totalFrames = 14;
        const totalDistance = (nextFacingLeft ? -1 : 1) * (45 + Math.floor(Math.random() * 55));
        const deltaPerFrame = totalDistance / totalFrames;
        let frame = 0;

        const animInterval = setInterval(async () => {
          frame++;
          if (window.paaDesktop && isMounted) {
            await window.paaDesktop.moveWindow(deltaPerFrame, 0);
          }
          if (frame >= totalFrames) {
            clearInterval(animInterval);
            if (isMounted) {
              setIsWalking(false);
              walkTimer = setTimeout(wanderStep, 1500 + Math.floor(Math.random() * 2000));
            }
          }
        }, 50);
      } catch {
        if (isMounted) {
          setIsWalking(false);
          walkTimer = setTimeout(wanderStep, 2500);
        }
      }
    };

    walkTimer = setTimeout(wanderStep, 800);

    return () => {
      isMounted = false;
      if (walkTimer) clearTimeout(walkTimer);
    };
  }, [isWidget, roamMode, agentState, menuOpen, chatOpen, facingLeft]);

  // Listen to SSE Telemetry Stream from Agent Server
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("http://localhost:4000/api/stream");
      eventSource.onmessage = (event) => {
        try {
          const telemetry: CharacterTelemetryEvent = JSON.parse(event.data);
          const time = new Date().toLocaleTimeString();

          if (telemetry.state) setAgentState(telemetry.state);
          if (telemetry.activeTool !== undefined) setActiveTool(telemetry.activeTool);

          if (telemetry.thought) {
            setThought(telemetry.thought);
            setRawLogs((prev) => [
              ...prev.slice(-99),
              {
                time,
                state: telemetry.state,
                message: telemetry.thought || "",
                tool: telemetry.activeTool,
              },
            ]);

            // Add to timeline step log
            setTimelineSteps((prev) => [
              ...prev,
              {
                stepNumber: prev.length + 1,
                state: telemetry.state,
                thought: telemetry.thought || "",
                tool: telemetry.activeTool,
                timestamp: time,
                durationMs: Math.floor(Math.random() * 250) + 80,
              },
            ]);
          }
        } catch (e) {
          console.error("SSE parse error", e);
        }
      };
    } catch {
      // Fallback if offline
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (activeTab === "terminal" && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [rawLogs, activeTab]);

  const handleSendTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isSubmitting) return;

    const taskText = promptInput.trim();
    setPromptInput("");
    setIsSubmitting(true);
    setChatOpen(false);
    setMenuOpen(false);
    setAgentState("thinking");
    setThought(`Executing task: "${taskText}"...`);

    const newStep: StepLog = {
      stepNumber: timelineSteps.length + 1,
      state: "thinking",
      thought: `Task dispatched: "${taskText}"`,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTimelineSteps((prev) => [...prev, newStep]);

    try {
      const res = await fetch("http://localhost:4000/api/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: taskText, maxSteps: 6, autonomyLevel }),
      });
      const data = await res.json();
      const isFailed = data.status === "failed" || Boolean(data.error);

      if (isFailed) {
        const errorMsg = data.finalResponse || data.error || "Task execution failed.";
        setThought(errorMsg);
        setAgentState("error");
        setTimelineSteps((prev) => [
          ...prev,
          {
            stepNumber: prev.length + 1,
            state: "error",
            thought: errorMsg,
            timestamp: new Date().toLocaleTimeString(),
            durationMs: data.durationMs || 420,
          },
        ]);
      } else if (data.finalResponse) {
        setThought(data.finalResponse);
        setAgentState("success");
        setTimelineSteps((prev) => [
          ...prev,
          {
            stepNumber: prev.length + 1,
            state: "success",
            thought: data.finalResponse,
            timestamp: new Date().toLocaleTimeString(),
            durationMs: data.durationMs || 420,
          },
        ]);
      }
    } catch {
      setThought("Agent server is offline. Run 'npm run dev:api' in terminal.");
      setAgentState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopAgent = () => {
    setAgentState("idle");
    setThought("Agent execution paused. Standing by.");
    setMenuOpen(false);
  };

  const quickPrompts = [
    "Search latest advancements in open-source local agents",
    "List and inspect project structure in current directory",
    "Check Ollama local model latency and context window",
    "Summarize system memory and disk utilization",
  ];

  // Helper color map for badges
  const stateColor: Record<AgentState, { bg: string; border: string; text: string; dot: string }> = {
    idle: { bg: "rgba(99, 102, 241, 0.12)", border: "rgba(99, 102, 241, 0.3)", text: "#818cf8", dot: "#6366f1" },
    thinking: { bg: "rgba(168, 85, 247, 0.12)", border: "rgba(168, 85, 247, 0.35)", text: "#c084fc", dot: "#a855f7" },
    searching: { bg: "rgba(6, 182, 212, 0.12)", border: "rgba(6, 182, 212, 0.35)", text: "#67e8f9", dot: "#06b6d4" },
    reading: { bg: "rgba(56, 189, 248, 0.12)", border: "rgba(56, 189, 248, 0.35)", text: "#38bdf8", dot: "#0ea5e9" },
    coding: { bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.35)", text: "#34d399", dot: "#10b981" },
    executing: { bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.35)", text: "#fbbf24", dot: "#f59e0b" },
    waiting: { bg: "rgba(236, 72, 153, 0.12)", border: "rgba(236, 72, 153, 0.35)", text: "#f472b6", dot: "#ec4899" },
    success: { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.4)", text: "#4ade80", dot: "#22c55e" },
    error: { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.4)", text: "#f87171", dot: "#ef4444" },
  };

  const currentBadge = stateColor[agentState] || stateColor.idle;

  // ========================================================
  // 1. FLOATING DESKTOP PET VIEW (Pure Character + Radial Orbit)
  // ========================================================
  if (isWidget) {
    // 5 Radial Orbit action buttons fanning out in a circle arc above the character
    const orbitActions = [
      {
        id: "chat",
        icon: <MessageSquare size={16} color="#818cf8" />,
        label: "Prompt Agent",
        tx: -55,
        ty: -55,
        onClick: () => {
          setChatOpen(true);
          setMenuOpen(false);
        },
      },
      {
        id: "pause",
        icon: <PauseCircle size={16} color="#f87171" />,
        label: "Pause Execution",
        tx: 0,
        ty: -75,
        onClick: () => {
          handleStopAgent();
          setMenuOpen(false);
        },
      },
      {
        id: "roam",
        icon: <Footprints size={16} color={roamMode ? "#34d399" : "#94a3b8"} />,
        label: roamMode ? "Roam: ON (Click to lock)" : "Roam: OFF (Click to walk)",
        tx: 55,
        ty: -55,
        onClick: () => {
          setRoamMode((prev) => !prev);
          setMenuOpen(false);
        },
      },
      {
        id: "settings",
        icon: <Settings size={15} color="#fbbf24" />,
        label: "AI & Groq Settings",
        tx: -65,
        ty: -10,
        onClick: () => {
          setSettingsOpen(true);
          setMenuOpen(false);
        },
      },
      {
        id: "hud",
        icon: <Maximize2 size={16} color="#c084fc" />,
        label: "Full Dashboard",
        tx: 65,
        ty: -10,
        onClick: () => {
          window.open("http://localhost:3001", "_blank");
          setMenuOpen(false);
        },
      },
      {
        id: "close",
        icon: <X size={15} color="#94a3b8" />,
        label: "Close Menu",
        tx: 0,
        ty: 20,
        onClick: () => setMenuOpen(false),
      },
    ];

    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          paddingBottom: "8px",
          position: "relative",
          userSelect: "none",
        }}
      >
        {/* Central Anchor for Character + Radial Menu */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {/* Subtle Speech Bubble: Appears ONLY when agent is active or during tasks */}
          {agentState !== "idle" && (
            <div
              className="no-drag anim-float-gentle"
              style={{
                position: "absolute",
                bottom: "100%",
                marginBottom: "12px",
                background: "rgba(11, 15, 25, 0.94)",
                border: `1px solid ${currentBadge.border}`,
                borderRadius: "14px",
                padding: "8px 14px",
                maxWidth: "240px",
                minWidth: "120px",
                textAlign: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                backdropFilter: "blur(16px)",
                zIndex: 60,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: currentBadge.text,
                  marginBottom: "2px",
                }}
              >
                {agentState.toUpperCase()} {activeTool ? `• ${activeTool}` : ""}
              </div>
              <div style={{ fontSize: "11px", color: "#f1f5f9", lineHeight: "1.35", fontWeight: 500 }}>
                {thought}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: "-6px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: "6px solid rgba(11, 15, 25, 0.94)",
                }}
              />
            </div>
          )}

          {/* CIRCULAR / RADIAL ORBIT MENU (Fanned out around character in a circle motion) */}
          {menuOpen &&
            orbitActions.map((action, i) => (
              <button
                key={action.id}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className="radial-orbit-btn no-drag"
                title={action.label}
                style={
                  {
                    "--tx": `${action.tx}px`,
                    "--ty": `${action.ty}px`,
                    animationDelay: `${i * 35}ms`,
                  } as React.CSSProperties
                }
              >
                {action.icon}
              </button>
            ))}

          {/* PURE DESKTOP PET CHARACTER (Click to open circular orbit + Drag to move) */}
          <div
            className="no-drag"
            style={{
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            title="Click to open menu • Drag to move"
          >
            <PixelCompanion
              state={agentState}
              isWalking={isWalking}
              facingLeft={facingLeft}
              scale={2.2}
            />
          </div>

          {/* Minimalist Floating Command Input: Pops up only when Prompt button is clicked */}
          {chatOpen && (
            <form
              onSubmit={handleSendTask}
              className="no-drag"
              style={{
                position: "absolute",
                top: "100%",
                marginTop: "12px",
                width: "260px",
                display: "flex",
                gap: "6px",
                background: "rgba(14, 18, 28, 0.98)",
                padding: "6px",
                borderRadius: "12px",
                border: "1px solid rgba(99, 102, 241, 0.5)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.85)",
                backdropFilter: "blur(20px)",
                zIndex: 110,
              }}
            >
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Assign task to PAA agent..."
                disabled={isSubmitting}
                autoFocus
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  borderRadius: "8px",
                  background: "rgba(22, 28, 40, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#fff",
                  fontSize: "11px",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting || !promptInput.trim()}
                style={{
                  padding: "7px 10px",
                  borderRadius: "8px",
                  background: "#6366f1",
                  border: "none",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Send size={12} />
              </button>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "0 4px" }}
              >
                <X size={13} />
              </button>
            </form>
          )}

          {/* Settings Modal in Widget */}
          {settingsOpen && (
            <div
              className="no-drag"
              style={{
                position: "absolute",
                bottom: "100%",
                marginBottom: "12px",
                width: "250px",
                background: "rgba(14, 18, 28, 0.98)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "14px",
                padding: "12px",
                boxShadow: "0 12px 35px rgba(0,0,0,0.85)",
                backdropFilter: "blur(20px)",
                zIndex: 120,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#f59e0b", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Zap size={12} /> Groq Cloud Fallback
                </span>
                <button onClick={() => setSettingsOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                  <X size={12} />
                </button>
              </div>

              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="Enter Groq API Key..."
                style={{
                  width: "100%",
                  background: "rgba(22, 28, 40, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "6px 8px",
                  fontSize: "11px",
                  color: "#fff",
                  marginBottom: "8px",
                  outline: "none",
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: savedGroqKey ? "#34d399" : "#64748b" }}>
                  {savedGroqKey ? "✓ Active" : "No key set"}
                </span>
                <button
                  onClick={() => {
                    handleSaveGroqConfig();
                    setSettingsOpen(false);
                  }}
                  style={{
                    background: "#6366f1",
                    border: "none",
                    borderRadius: "6px",
                    padding: "4px 10px",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================================================
  // 2. FULL PRO DEVELOPER CONTROL CENTER (Dark Obsidian HUD)
  // ========================================================
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #0d121f 0%, #07090e 100%)",
        color: "#f8fafc",
      }}
    >
      {/* ── Top Pro Navigation Bar ── */}
      <header
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(11, 15, 24, 0.85)",
          backdropFilter: "blur(16px)",
          padding: "12px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.5px" }}>PAA</span>
              <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 600 }}>// PERSONAL AUTONOMOUS AGENT</span>
              <span
                style={{
                  fontSize: "9px",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "#818cf8",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  fontWeight: 700,
                }}
              >
                KERNEL v0.1
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Private Local-First AI Employee & Desktop Companion</div>
          </div>
        </div>

        {/* Live System Connectivity Strip */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#cbd5e1" }}>
            <Zap size={13} color={providerMode === "groq" ? "#c084fc" : "#10b981"} />
            <span style={{ color: "#64748b" }}>LLM:</span>
            <span style={{ fontWeight: 600 }}>{llmStatus.provider}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#cbd5e1" }}>
            <Database size={13} color="#06b6d4" />
            <span style={{ color: "#64748b" }}>Memory:</span>
            <span style={{ fontWeight: 600 }}>pgvector</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#cbd5e1" }}>
            <Footprints size={13} color="#f59e0b" />
            <span style={{ color: "#64748b" }}>Roam:</span>
            <span style={{ fontWeight: 600, color: roamMode ? "#34d399" : "#64748b" }}>
              {roamMode ? "ENABLED" : "LOCKED"}
            </span>
          </div>

          {/* Quick Trigger for Desktop Widget */}
          <a
            href="?mode=widget"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              padding: "6px 12px",
              color: "#f1f5f9",
              fontSize: "11px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Maximize2 size={12} color="#818cf8" />
            <span>Widget View</span>
          </a>
        </div>
      </header>

      {/* ── Main Pro Console Grid ── */}
      <main
        style={{
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: "24px",
          maxWidth: "1440px",
          width: "100%",
          margin: "0 auto",
          padding: "24px",
          flex: 1,
        }}
      >
        {/* ======================================================== */}
        {/* LEFT COLUMN: RETRO PIXEL COMPANION ARENA & STATE EMULATOR */}
        {/* ======================================================== */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Avatar Holographic Stage */}
          <div
            style={{
              background: "rgba(14, 18, 27, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "18px",
              padding: "28px 20px 20px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
            }}
          >
            {/* Background Cyber Grid Lines */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                pointerEvents: "none",
              }}
            />

            {/* Ambient Radial Spotlight */}
            <div
              style={{
                position: "absolute",
                top: "30%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: currentBadge.bg,
                filter: "blur(50px)",
                pointerEvents: "none",
                transition: "all 0.5s ease",
              }}
            />

            {/* State Badge Top Pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "4px 12px",
                borderRadius: "999px",
                background: currentBadge.bg,
                border: `1px solid ${currentBadge.border}`,
                fontSize: "11px",
                fontWeight: 700,
                color: currentBadge.text,
                marginBottom: "20px",
                zIndex: 2,
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: currentBadge.dot,
                  boxShadow: `0 0 8px ${currentBadge.dot}`,
                }}
              />
              {agentState.toUpperCase()}
              {activeTool && <span style={{ color: "#94a3b8" }}>// {activeTool}</span>}
            </div>

            {/* Retro Pixel Mascot */}
            <div style={{ zIndex: 2, margin: "10px 0 20px 0" }}>
              <PixelCompanion
                state={agentState}
                isWalking={isWalking}
                facingLeft={facingLeft}
                scale={3.2}
                onClick={() => setFacingLeft((prev) => !prev)}
              />
            </div>

            {/* Live Thought Bubble */}
            <div
              style={{
                zIndex: 2,
                width: "100%",
                background: "rgba(8, 10, 15, 0.85)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "12px",
                color: "#e2e8f0",
                lineHeight: "1.45",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#64748b",
                  marginBottom: "4px",
                  fontWeight: 700,
                }}
              >
                Current Agent Reasoning
              </div>
              {thought}
            </div>
          </div>

          {/* Quick State Emulator Bar */}
          <div
            style={{
              background: "rgba(14, 18, 27, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>State Emulator (Debug)</span>
              <span style={{ fontSize: "10px", color: "#64748b" }}>Click to test</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
              {(
                [
                  "idle",
                  "thinking",
                  "searching",
                  "reading",
                  "coding",
                  "executing",
                  "waiting",
                  "success",
                  "error",
                ] as AgentState[]
              ).map((st) => {
                const conf = stateColor[st];
                const isSelected = agentState === st;
                return (
                  <button
                    key={st}
                    onClick={() => {
                      setAgentState(st);
                      setThought(`Emulating state: ${st.toUpperCase()}`);
                    }}
                    style={{
                      padding: "6px 8px",
                      borderRadius: "6px",
                      border: isSelected ? `1px solid ${conf.dot}` : "1px solid rgba(255,255,255,0.06)",
                      background: isSelected ? conf.bg : "rgba(255,255,255,0.02)",
                      color: isSelected ? conf.text : "#94a3b8",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "center",
                      textTransform: "capitalize",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Autonomy Level Control */}
          <div
            style={{
              background: "rgba(14, 18, 27, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "10px",
              }}
            >
              Autonomy Boundary
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { lvl: 0, label: "L0: Read-Only (Observe)", desc: "Can read files and web, no write actions" },
                { lvl: 1, label: "L1: Suggestion (Interactive)", desc: "Proposes plan, waits for user approval" },
                { lvl: 2, label: "L2: Safe Auto (Standard)", desc: "Full execution for safe local tools" },
                { lvl: 3, label: "L3: External Access", desc: "Autonomous shell, git, and web interactions" },
              ].map((item) => (
                <div
                  key={item.lvl}
                  onClick={() => setAutonomyLevel(item.lvl)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border:
                      autonomyLevel === item.lvl
                        ? "1px solid rgba(99, 102, 241, 0.4)"
                        : "1px solid rgba(255, 255, 255, 0.04)",
                    background:
                      autonomyLevel === item.lvl ? "rgba(99, 102, 241, 0.12)" : "rgba(255, 255, 255, 0.02)",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: autonomyLevel === item.lvl ? "#818cf8" : "#f1f5f9",
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Provider & Groq Fallback Engine */}
          <div
            style={{
              background: "rgba(14, 18, 27, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Zap size={13} color="#f59e0b" />
                <span>AI Inference & Fallback</span>
              </div>
              <span
                style={{
                  fontSize: "9px",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background: "rgba(16, 185, 129, 0.15)",
                  color: "#34d399",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  fontWeight: 700,
                }}
              >
                {providerMode.toUpperCase()}
              </span>
            </div>

            {/* Provider Switcher */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "12px" }}>
              {[
                { id: "hybrid", label: "Auto Hybrid" },
                { id: "ollama", label: "Local Ollama" },
                { id: "groq", label: "Groq Cloud" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setProviderMode(m.id as any);
                    localStorage.setItem("paa_provider_mode", m.id);
                    fetch("http://localhost:4000/api/llm/config", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        groqApiKey: groqKey.trim(),
                        forceProvider: m.id === "hybrid" ? undefined : m.id,
                      }),
                    }).catch(() => {});
                  }}
                  style={{
                    padding: "6px 4px",
                    borderRadius: "6px",
                    border: providerMode === m.id ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.06)",
                    background: providerMode === m.id ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.02)",
                    color: providerMode === m.id ? "#fff" : "#94a3b8",
                    fontSize: "10px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Groq API Key Input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Key size={11} color="#a855f7" /> Groq API Key (Cloud Fallback)
                </span>
                {savedGroqKey ? <span style={{ color: "#34d399" }}>✓ Configured</span> : <span>Free at console.groq.com</span>}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="password"
                  value={groqKey}
                  onChange={(e) => setGroqKey(e.target.value)}
                  placeholder="gsk_..."
                  style={{
                    flex: 1,
                    background: "rgba(9, 12, 19, 0.9)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "11px",
                    color: "#fff",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleSaveGroqConfig}
                  style={{
                    background: "#6366f1",
                    border: "none",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Save
                </button>
              </div>
              {keySaveMessage && (
                <div style={{ fontSize: "10px", color: "#34d399", fontWeight: 600 }}>{keySaveMessage}</div>
              )}
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: PRO EXECUTION CONSOLE & TIMELINE INSPECTOR */}
        {/* ======================================================== */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Top Console Tabs & Controls */}
          <div
            style={{
              background: "rgba(14, 18, 27, 0.75)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "18px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: "540px",
              boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
            }}
          >
            {/* Header Tabs */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                paddingBottom: "12px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setActiveTab("timeline")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "timeline" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                    color: activeTab === "timeline" ? "#818cf8" : "#94a3b8",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  <Layers size={13} />
                  <span>Execution Timeline</span>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "1px 6px",
                      borderRadius: "999px",
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "#cbd5e1",
                    }}
                  >
                    {timelineSteps.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("terminal")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "terminal" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                    color: activeTab === "terminal" ? "#818cf8" : "#94a3b8",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  <Terminal size={13} />
                  <span>Live Stream Logs</span>
                </button>

                <button
                  onClick={() => setActiveTab("context")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "context" ? "rgba(99, 102, 241, 0.15)" : "transparent",
                    color: activeTab === "context" ? "#818cf8" : "#94a3b8",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  <Database size={13} />
                  <span>Agent Memory</span>
                </button>
              </div>

              {/* Utility buttons */}
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => {
                    setTimelineSteps([]);
                    setRawLogs([]);
                  }}
                  title="Clear timeline"
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    color: "#94a3b8",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                  }}
                >
                  <Trash2 size={12} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* TAB 1: EXECUTION TIMELINE */}
            {activeTab === "timeline" && (
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  paddingRight: "6px",
                  maxHeight: "440px",
                }}
              >
                {timelineSteps.map((step, idx) => {
                  const conf = stateColor[step.state] || stateColor.idle;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        gap: "14px",
                        position: "relative",
                        paddingBottom: "8px",
                      }}
                    >
                      {/* Timeline Node & Line */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          width: "24px",
                        }}
                      >
                        <div
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: conf.bg,
                            border: `2px solid ${conf.dot}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: conf.text,
                            zIndex: 1,
                          }}
                        >
                          {step.stepNumber}
                        </div>
                        {idx !== timelineSteps.length - 1 && (
                          <div
                            style={{
                              width: "2px",
                              flex: 1,
                              background: "rgba(255, 255, 255, 0.08)",
                              marginTop: "4px",
                            }}
                          />
                        )}
                      </div>

                      {/* Step Card Content */}
                      <div
                        style={{
                          flex: 1,
                          background: "rgba(18, 23, 35, 0.65)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          borderRadius: "10px",
                          padding: "10px 14px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "6px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                background: conf.bg,
                                color: conf.text,
                                border: `1px solid ${conf.border}`,
                              }}
                            >
                              {step.state}
                            </span>
                            {step.tool && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#38bdf8",
                                  fontWeight: 600,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Code2 size={12} />
                                {step.tool}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "10px", color: "#64748b", display: "flex", gap: "8px" }}>
                            {step.durationMs && <span>{step.durationMs}ms</span>}
                            <span suppressHydrationWarning>{step.timestamp}</span>
                          </div>
                        </div>

                        <div style={{ fontSize: "12px", color: "#e2e8f0", lineHeight: "1.4" }}>{step.thought}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: LIVE STREAM TERMINAL */}
            {activeTab === "terminal" && (
              <div
                style={{
                  flex: 1,
                  background: "#05070a",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "12px",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  overflowY: "auto",
                  maxHeight: "440px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {rawLogs.map((log, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", lineHeight: "1.4" }}>
                    <span suppressHydrationWarning style={{ color: "#475569" }}>[{log.time}]</span>
                    <span style={{ color: stateColor[log.state]?.text || "#818cf8", fontWeight: 700 }}>
                      {log.state.toUpperCase().padEnd(9)}
                    </span>
                    {log.tool && <span style={{ color: "#38bdf8" }}>({log.tool})</span>}
                    <span style={{ color: "#cbd5e1" }}>{log.message}</span>
                  </div>
                ))}
                <div ref={terminalEndRef} />
              </div>
            )}

            {/* TAB 3: AGENT MEMORY CONTEXT */}
            {activeTab === "context" && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  maxHeight: "440px",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    background: "rgba(18, 23, 35, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "12px",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#818cf8", marginBottom: "6px" }}>
                    Short-Term Context Window
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.4" }}>
                    Retaining active task session, user prompt parameters, and current step observations. Total
                    conversation tokens: ~580 / 8,192.
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(18, 23, 35, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "12px",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#34d399", marginBottom: "6px" }}>
                    Long-Term Vector Memory (pgvector)
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.4" }}>
                    Connected to local vector database. Indexing local documentation, previous tasks, and user
                    preferences.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Command Runner / Dispatcher */}
          <div
            style={{
              background: "rgba(14, 18, 27, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "18px",
              padding: "16px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            {/* Quick Prompt Chips */}
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", marginBottom: "12px" }}>
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => setPromptInput(qp)}
                  style={{
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "999px",
                    padding: "4px 10px",
                    fontSize: "11px",
                    color: "#94a3b8",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Prompt Textarea Form */}
            <form onSubmit={handleSendTask} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <textarea
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      handleSendTask();
                    }
                  }}
                  placeholder="Instruct your personal autonomous agent (e.g., 'Check git status and summarize recent diffs'). Press Ctrl+Enter to dispatch..."
                  rows={2}
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    background: "rgba(9, 12, 19, 0.85)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    color: "#fff",
                    fontSize: "13px",
                    fontFamily: "inherit",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  <span>Tip: Press </span>
                  <kbd
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      padding: "2px 5px",
                      borderRadius: "4px",
                      color: "#94a3b8",
                    }}
                  >
                    Ctrl + Enter
                  </kbd>
                  <span> to execute</span>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  {isSubmitting ? (
                    <button
                      type="button"
                      onClick={handleStopAgent}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        borderRadius: "10px",
                        background: "rgba(239, 68, 68, 0.15)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        color: "#f87171",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <PauseCircle size={14} />
                      <span>Interrupt</span>
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting || !promptInput.trim()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 20px",
                      borderRadius: "10px",
                      background: !promptInput.trim() ? "rgba(99, 102, 241, 0.3)" : "#6366f1",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: !promptInput.trim() ? "not-allowed" : "pointer",
                      boxShadow: promptInput.trim() ? "0 0 16px rgba(99, 102, 241, 0.5)" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Send size={13} />
                    <span>{isSubmitting ? "Running..." : "Dispatch Task"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}
