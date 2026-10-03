"use client";

import React, { useId } from "react";
import type { AgentState } from "../types/agent";

interface PixelCompanionProps {
  state: AgentState;
  isWalking?: boolean;
  facingLeft?: boolean;
  scale?: number;
  onClick?: () => void;
  showAccessories?: boolean;
}

/**
 * PixelCompanion: An authentic 16-bit retro pixel-art desktop companion.
 * Renders sharp, crisp pixel art using SVG with crispEdges and CSS keyframes.
 * Supports distinct states: idle, thinking, searching, reading, coding, executing, waiting, success, error.
 */
export function PixelCompanion({
  state,
  isWalking = false,
  facingLeft = false,
  scale = 1,
  onClick,
  showAccessories = true,
}: PixelCompanionProps) {
  const compId = useId().replace(/:/g, "");

  // Color theme palette for pixel accessories
  const themeMap: Record<AgentState, { accent: string; glow: string; text: string }> = {
    idle: { accent: "#6366f1", glow: "rgba(99, 102, 241, 0.4)", text: "IDLE" },
    thinking: { accent: "#a855f7", glow: "rgba(168, 85, 247, 0.5)", text: "THINKING" },
    searching: { accent: "#06b6d4", glow: "rgba(6, 182, 212, 0.5)", text: "SEARCHING" },
    reading: { accent: "#38bdf8", glow: "rgba(56, 189, 248, 0.5)", text: "READING" },
    coding: { accent: "#10b981", glow: "rgba(16, 185, 129, 0.6)", text: "CODING" },
    executing: { accent: "#f59e0b", glow: "rgba(245, 158, 11, 0.6)", text: "EXECUTING" },
    waiting: { accent: "#ec4899", glow: "rgba(236, 72, 153, 0.5)", text: "WAITING" },
    success: { accent: "#22c55e", glow: "rgba(34, 197, 94, 0.7)", text: "SUCCESS" },
    error: { accent: "#ef4444", glow: "rgba(239, 68, 68, 0.7)", text: "ERROR" },
  };

  const currentTheme = themeMap[state] || themeMap.idle;

  // Base canvas size: 48 x 48 pixel grid
  const width = 48;
  const height = 48;
  const pixelSize = 4 * scale;

  return (
    <div
      onClick={onClick}
      className={`pixel-companion-root state-${state} ${isWalking ? "is-walking" : ""}`}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: onClick ? "pointer" : "default",
        transform: facingLeft ? "scaleX(-1)" : "scaleX(1)",
        transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
        imageRendering: "pixelated",
        userSelect: "none",
        position: "relative",
      }}
      title={`PAA Companion (${state})`}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width * (pixelSize / 4)}
        height={height * (pixelSize / 4)}
        style={{
          shapeRendering: "crispEdges",
          imageRendering: "pixelated",
          overflow: "visible",
          filter: `drop-shadow(0 6px 14px ${currentTheme.glow})`,
        }}
      >
        <defs>
          <filter id={`pixel-glow-${compId}`}>
            <feDropShadow dx="0" dy="1" stdDeviation="0.5" floodColor={currentTheme.accent} floodOpacity="0.8" />
          </filter>
        </defs>

        {/* ======================================================== */}
        {/* SHADOW BASE */}
        {/* ======================================================== */}
        <ellipse
          cx="24"
          cy="44"
          rx="12"
          ry="3"
          fill="rgba(0, 0, 0, 0.45)"
          className={state === "success" ? "anim-pixel-shadow-bounce" : "anim-pixel-shadow"}
        />

        {/* ======================================================== */}
        {/* CHARACTER MAIN BODY GROUP (Animated via CSS classes)    */}
        {/* ======================================================== */}
        <g className={isWalking ? "anim-pixel-waddle" : state === "success" ? "anim-pixel-jump" : state === "coding" ? "anim-pixel-coding-bob" : "anim-pixel-idle"}>

          {/* TAIL (Swishing back and forth) */}
          <g className="anim-pixel-tail">
            <rect x="10" y="32" width="3" height="3" fill="#2d3748" />
            <rect x="7" y="30" width="3" height="3" fill="#2d3748" />
            <rect x="5" y="27" width="3" height="4" fill="#6366f1" />
            <rect x="6" y="25" width="3" height="3" fill="#818cf8" />
          </g>

          {/* CAT EARS */}
          {/* Left Ear */}
          <rect x="15" y="11" width="3" height="3" fill="#1e293b" />
          <rect x="14" y="14" width="5" height="4" fill="#1e293b" />
          <rect x="16" y="14" width="2" height="3" fill="#ec4899" />

          {/* Right Ear */}
          <rect x="30" y="11" width="3" height="3" fill="#1e293b" />
          <rect x="29" y="14" width="5" height="4" fill="#1e293b" />
          <rect x="30" y="14" width="2" height="3" fill="#ec4899" />

          {/* HEAD OUTLINE & BASE */}
          <rect x="15" y="16" width="18" height="13" fill="#1e293b" rx="0" />
          <rect x="13" y="18" width="22" height="9" fill="#1e293b" />
          {/* Head Highlights / Gradient */}
          <rect x="16" y="17" width="16" height="10" fill="#334155" />
          <rect x="17" y="18" width="14" height="2" fill="#475569" />

          {/* FOREHEAD CYBER CREST / VISOR GEM */}
          <rect x="22" y="17" width="4" height="3" fill={currentTheme.accent} />
          <rect x="23" y="18" width="2" height="1" fill="#ffffff" />

          {/* EYES LAYER */}
          {state === "error" ? (
            /* Error: Crossed Dizzy Eyes */
            <g>
              <rect x="17" y="21" width="2" height="2" fill="#ef4444" />
              <rect x="19" y="23" width="2" height="2" fill="#ef4444" />
              <rect x="19" y="21" width="2" height="2" fill="#ef4444" />
              <rect x="17" y="23" width="2" height="2" fill="#ef4444" />

              <rect x="27" y="21" width="2" height="2" fill="#ef4444" />
              <rect x="29" y="23" width="2" height="2" fill="#ef4444" />
              <rect x="29" y="21" width="2" height="2" fill="#ef4444" />
              <rect x="27" y="23" width="2" height="2" fill="#ef4444" />
            </g>
          ) : state === "success" ? (
            /* Success: Happy Closed Arc Eyes (^_^) */
            <g>
              <rect x="17" y="22" width="1" height="2" fill="#34d399" />
              <rect x="18" y="21" width="3" height="1" fill="#34d399" />
              <rect x="21" y="22" width="1" height="2" fill="#34d399" />

              <rect x="26" y="22" width="1" height="2" fill="#34d399" />
              <rect x="27" y="21" width="3" height="1" fill="#34d399" />
              <rect x="30" y="22" width="1" height="2" fill="#34d399" />
            </g>
          ) : state === "thinking" ? (
            /* Thinking: Looking Up-Right with Glowing Iris */
            <g className="anim-pixel-eye-think">
              <rect x="17" y="20" width="4" height="4" fill="#090d16" />
              <rect x="19" y="20" width="2" height="2" fill={currentTheme.accent} />
              <rect x="20" y="20" width="1" height="1" fill="#ffffff" />

              <rect x="27" y="20" width="4" height="4" fill="#090d16" />
              <rect x="29" y="20" width="2" height="2" fill={currentTheme.accent} />
              <rect x="30" y="20" width="1" height="1" fill="#ffffff" />
            </g>
          ) : (
            /* Standard Cyber Eyes (Blinking animation) */
            <g className="anim-pixel-blink">
              <rect x="17" y="21" width="4" height="4" fill="#090d16" />
              <rect x="18" y="21" width="3" height="3" fill={currentTheme.accent} />
              <rect x="19" y="21" width="1" height="1" fill="#ffffff" />

              <rect x="27" y="21" width="4" height="4" fill="#090d16" />
              <rect x="28" y="21" width="3" height="3" fill={currentTheme.accent} />
              <rect x="29" y="21" width="1" height="1" fill="#ffffff" />
            </g>
          )}

          {/* CHEEKS / BLUSH */}
          <rect x="14" y="24" width="2" height="1" fill="rgba(244, 114, 182, 0.6)" />
          <rect x="32" y="24" width="2" height="1" fill="rgba(244, 114, 182, 0.6)" />

          {/* NOSE & MOUTH */}
          <rect x="23" y="24" width="2" height="1" fill="#f472b6" />
          {state === "success" ? (
            <path d="M 22 26 L 24 27 L 26 26" stroke="#f472b6" strokeWidth="1" fill="none" />
          ) : (
            <rect x="23" y="26" width="2" height="1" fill="#94a3b8" />
          )}

          {/* CYBER COLLAR & BELL */}
          <rect x="17" y="29" width="14" height="2" fill="#0f172a" />
          <rect x="22" y="30" width="4" height="3" fill={currentTheme.accent} />
          <rect x="23" y="31" width="2" height="1" fill="#ffffff" />

          {/* TORSO & BELLY */}
          <rect x="16" y="31" width="16" height="10" fill="#1e293b" />
          <rect x="19" y="32" width="10" height="7" fill="#334155" />
          <rect x="21" y="33" width="6" height="5" fill="#f1f5f9" />

          {/* LEGS / PAWS */}
          {/* Left Foot */}
          <g className={isWalking ? "anim-pixel-foot-left" : ""}>
            <rect x="17" y="40" width="4" height="3" fill="#1e293b" />
            <rect x="17" y="42" width="4" height="2" fill="#334155" />
          </g>

          {/* Right Foot */}
          <g className={isWalking ? "anim-pixel-foot-right" : ""}>
            <rect x="27" y="40" width="4" height="3" fill="#1e293b" />
            <rect x="27" y="42" width="4" height="2" fill="#334155" />
          </g>

          {/* ======================================================== */}
          {/* STATE-SPECIFIC RETRO PROPS & ACCESSORIES                */}
          {/* ======================================================== */}
          {showAccessories && (
            <>
              {/* CODING STATE: Retro Pixel Laptop + Green Matrix Screen */}
              {state === "coding" && (
                <g className="anim-pixel-laptop">
                  {/* Laptop Base */}
                  <rect x="15" y="38" width="18" height="3" fill="#475569" />
                  <rect x="16" y="39" width="16" height="1" fill="#94a3b8" />
                  {/* Laptop Screen */}
                  <rect x="17" y="30" width="14" height="8" fill="#0f172a" />
                  <rect x="18" y="31" width="12" height="6" fill="#052e16" />
                  {/* Neon code lines */}
                  <rect x="19" y="32" width="6" height="1" fill="#22c55e" />
                  <rect x="19" y="34" width="9" height="1" fill="#4ade80" />
                  <rect x="19" y="35" width="4" height="1" fill="#86efac" />
                  {/* Fast typing paws */}
                  <g className="anim-pixel-typing-paws">
                    <rect x="18" y="37" width="3" height="2" fill="#f1f5f9" />
                    <rect x="27" y="37" width="3" height="2" fill="#f1f5f9" />
                  </g>
                </g>
              )}

              {/* SEARCHING STATE: Radar Scanner Sweep */}
              {state === "searching" && (
                <g className="anim-pixel-radar">
                  <rect x="33" y="16" width="2" height="6" fill="#94a3b8" />
                  <circle cx="34" cy="14" r="3" fill="none" stroke="#06b6d4" strokeWidth="1" />
                  <rect x="33" y="13" width="2" height="2" fill="#22d3ee" />
                </g>
              )}

              {/* READING STATE: Pixel Book */}
              {state === "reading" && (
                <g className="anim-pixel-book">
                  <rect x="17" y="35" width="14" height="7" fill="#0284c7" />
                  <rect x="18" y="36" width="5" height="5" fill="#f8fafc" />
                  <rect x="25" y="36" width="5" height="5" fill="#f8fafc" />
                  {/* Text lines */}
                  <rect x="19" y="37" width="3" height="1" fill="#94a3b8" />
                  <rect x="19" y="39" width="3" height="1" fill="#94a3b8" />
                  <rect x="26" y="37" width="3" height="1" fill="#94a3b8" />
                  <rect x="26" y="39" width="3" height="1" fill="#94a3b8" />
                </g>
              )}

              {/* THINKING STATE: Animated Lightbulb / Idea Dots */}
              {state === "thinking" && (
                <g className="anim-pixel-bulb">
                  <rect x="23" y="4" width="2" height="3" fill="#eab308" />
                  <rect x="22" y="2" width="4" height="2" fill="#fde047" />
                  <rect x="21" y="3" width="6" height="2" fill="#fde047" />
                  <rect x="23" y="7" width="2" height="1" fill="#94a3b8" />
                  {/* Sparkles */}
                  <rect x="18" y="2" width="1" height="1" fill="#fef08a" />
                  <rect x="29" y="2" width="1" height="1" fill="#fef08a" />
                </g>
              )}

              {/* EXECUTING STATE: Spinning Gears / Sparks */}
              {state === "executing" && (
                <g className="anim-pixel-gear">
                  <rect x="33" y="22" width="5" height="5" fill="#f59e0b" />
                  <rect x="35" y="20" width="1" height="9" fill="#fbbf24" />
                  <rect x="31" y="24" width="9" height="1" fill="#fbbf24" />
                  <rect x="34" y="23" width="3" height="3" fill="#78350f" />
                </g>
              )}

              {/* SUCCESS STATE: Star Bursts */}
              {state === "success" && (
                <g className="anim-pixel-stars">
                  <rect x="8" y="10" width="3" height="3" fill="#facc15" />
                  <rect x="9" y="9" width="1" height="5" fill="#fde047" />
                  <rect x="7" y="11" width="5" height="1" fill="#fde047" />

                  <rect x="37" y="8" width="3" height="3" fill="#4ade80" />
                  <rect x="38" y="7" width="1" height="5" fill="#86efac" />
                  <rect x="36" y="9" width="5" height="1" fill="#86efac" />
                </g>
              )}
            </>
          )}

        </g>
      </svg>
    </div>
  );
}
