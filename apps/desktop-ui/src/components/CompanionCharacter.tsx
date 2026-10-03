"use client";

import React from "react";
import { AgentState } from "@paa/shared";

interface CompanionCharacterProps {
  state: AgentState;
  activeTool?: string;
  thought?: string;
}

export function CompanionCharacter({ state, activeTool, thought }: CompanionCharacterProps) {
  // Color theme by state
  const colors: Record<AgentState, { primary: string; glow: string; eye: string }> = {
    idle: { primary: "#6366f1", glow: "rgba(99, 102, 241, 0.4)", eye: "#38bdf8" },
    thinking: { primary: "#8b5cf6", glow: "rgba(139, 92, 246, 0.6)", eye: "#c084fc" },
    searching: { primary: "#06b6d4", glow: "rgba(6, 182, 212, 0.6)", eye: "#67e8f9" },
    reading: { primary: "#0ea5e9", glow: "rgba(14, 165, 233, 0.6)", eye: "#38bdf8" },
    coding: { primary: "#10b981", glow: "rgba(16, 185, 129, 0.6)", eye: "#34d399" },
    executing: { primary: "#f59e0b", glow: "rgba(245, 158, 11, 0.6)", eye: "#fbbf24" },
    waiting: { primary: "#ec4899", glow: "rgba(236, 72, 153, 0.6)", eye: "#f472b6" },
    success: { primary: "#22c55e", glow: "rgba(34, 197, 94, 0.7)", eye: "#4ade80" },
    error: { primary: "#ef4444", glow: "rgba(239, 68, 68, 0.7)", eye: "#f87171" },
  };

  const currentTheme = colors[state] || colors.idle;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
      {/* Speech Thought Bubble */}
      {thought && (
        <div
          style={{
            marginBottom: "16px",
            background: "rgba(24, 28, 44, 0.9)",
            border: `1px solid ${currentTheme.primary}44`,
            borderRadius: "16px",
            padding: "10px 18px",
            maxWidth: "340px",
            textAlign: "center",
            boxShadow: `0 4px 20px ${currentTheme.glow}`,
            backdropFilter: "blur(10px)",
            position: "relative",
            animation: "float 4s ease-in-out infinite",
          }}
        >
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: currentTheme.primary, marginBottom: "4px" }}>
            {state.toUpperCase()} {activeTool ? `• ${activeTool}` : ""}
          </div>
          <div style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: "1.4" }}>
            {thought}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: `8px solid rgba(24, 28, 44, 0.9)`,
            }}
          />
        </div>
      )}

      {/* SVG Animated Robot Companion */}
      <div
        className={state === "success" ? "anim-bounce" : "anim-float"}
        style={{
          width: "180px",
          height: "180px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: `drop-shadow(0 10px 25px ${currentTheme.glow})`,
        }}
      >
        <svg viewBox="0 0 200 200" width="180" height="180" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Outer Halo Ring (Rotates when executing/thinking) */}
          <circle
            cx="100"
            cy="100"
            r="88"
            stroke={currentTheme.primary}
            strokeWidth="2"
            strokeDasharray="12 12"
            opacity="0.5"
            className={state === "executing" || state === "thinking" ? "anim-spin" : ""}
            style={{ transformOrigin: "center" }}
          />

          {/* Floating Antenna with pulsing bulb */}
          <line x1="100" y1="52" x2="100" y2="28" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <circle
            cx="100"
            cy="24"
            r="8"
            fill={currentTheme.primary}
            style={{ filter: `drop-shadow(0 0 8px ${currentTheme.eye})` }}
          />

          {/* Robot Ears / Headsets */}
          <rect x="28" y="80" width="14" height="34" rx="7" fill="#334155" stroke="#475569" strokeWidth="2" />
          <rect x="158" y="80" width="14" height="34" rx="7" fill="#334155" stroke="#475569" strokeWidth="2" />

          {/* Main Head Chassis */}
          <rect
            x="40"
            y="52"
            width="120"
            height="90"
            rx="30"
            fill="url(#headGradient)"
            stroke="#475569"
            strokeWidth="3"
          />

          {/* Visor Screen */}
          <rect
            x="52"
            y="66"
            width="96"
            height="62"
            rx="18"
            fill="#090d16"
            stroke={currentTheme.primary}
            strokeWidth="2"
            opacity="0.95"
          />

          {/* Scanning line for 'reading' and 'searching' states */}
          {(state === "reading" || state === "searching") && (
            <line
              x1="56"
              y1="75"
              x2="144"
              y2="75"
              stroke={currentTheme.eye}
              strokeWidth="2"
              className="anim-scan"
            />
          )}

          {/* Left Eye */}
          {state === "error" ? (
            <text x="68" y="105" fontSize="22" fill="#ef4444" fontWeight="bold">✕</text>
          ) : state === "success" ? (
            <path d="M 66 98 Q 76 88 86 98" stroke={currentTheme.eye} strokeWidth="4" strokeLinecap="round" fill="none" />
          ) : (
            <circle cx="76" cy="95" r={state === "thinking" ? "9" : "8"} fill={currentTheme.eye} />
          )}

          {/* Right Eye */}
          {state === "error" ? (
            <text x="112" y="105" fontSize="22" fill="#ef4444" fontWeight="bold">✕</text>
          ) : state === "success" ? (
            <path d="M 114 98 Q 124 88 134 98" stroke={currentTheme.eye} strokeWidth="4" strokeLinecap="round" fill="none" />
          ) : (
            <circle cx="124" cy="95" r={state === "thinking" ? "9" : "8"} fill={currentTheme.eye} />
          )}

          {/* Cyber Mouth / Expression Indicator */}
          {state === "success" ? (
            <path d="M 90 114 Q 100 122 110 114" stroke={currentTheme.eye} strokeWidth="3" strokeLinecap="round" fill="none" />
          ) : state === "coding" ? (
            <rect x="88" y="112" width="24" height="4" rx="2" fill="#34d399" />
          ) : (
            <ellipse cx="100" cy="115" rx="10" ry="2" fill="#334155" />
          )}

          {/* Cyber Body and Hands */}
          <rect x="75" y="146" width="50" height="24" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <circle cx="100" cy="158" r="5" fill={currentTheme.primary} />

          {/* Defs for metallic shader */}
          <defs>
            <linearGradient id="headGradient" x1="40" y1="52" x2="160" y2="142" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1e293b" />
              <stop offset="1" stopColor="#0f172a" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* State Status Badge */}
      <div
        style={{
          marginTop: "16px",
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "999px",
          background: "rgba(15, 23, 42, 0.7)",
          border: `1px solid ${currentTheme.primary}66`,
          fontSize: "12px",
          fontWeight: 600,
          color: currentTheme.primary,
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: currentTheme.primary,
            boxShadow: `0 0 10px ${currentTheme.primary}`,
          }}
        />
        {state.toUpperCase()}
      </div>
    </div>
  );
}
