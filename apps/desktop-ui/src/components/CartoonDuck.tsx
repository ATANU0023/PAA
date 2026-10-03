"use client";

import React from "react";
import type { AgentState } from "../types/agent";

interface CartoonDuckProps {
  state: AgentState;
  isWalking?: boolean;
  facingLeft?: boolean;
  isSpeaking?: boolean;
  onClick?: () => void;
}

export function CartoonDuck({
  state,
  isWalking = false,
  facingLeft = false,
  onClick,
}: CartoonDuckProps) {
  // Glow themes per state
  const stateGlows: Record<AgentState, string> = {
    idle: "drop-shadow(0 8px 20px rgba(255, 214, 0, 0.45))",
    thinking: "drop-shadow(0 8px 24px rgba(168, 85, 247, 0.6))",
    searching: "drop-shadow(0 8px 24px rgba(6, 182, 212, 0.6))",
    reading: "drop-shadow(0 8px 24px rgba(56, 189, 248, 0.6))",
    coding: "drop-shadow(0 8px 24px rgba(34, 197, 94, 0.6))",
    executing: "drop-shadow(0 8px 24px rgba(245, 158, 11, 0.6))",
    waiting: "drop-shadow(0 8px 24px rgba(236, 72, 153, 0.6))",
    success: "drop-shadow(0 10px 30px rgba(250, 204, 21, 0.8))",
    error: "drop-shadow(0 8px 24px rgba(239, 68, 68, 0.7))",
  };

  const currentGlow = stateGlows[state] || stateGlows.idle;

  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        position: "relative",
        width: "210px",
        height: "240px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: facingLeft ? "scaleX(-1)" : "scaleX(1)",
        transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        userSelect: "none",
      }}
    >
      {/* Real High-Resolution Mascot Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot.png"
        alt="PAA Mascot"
        draggable={false}
        className={isWalking ? "anim-duck-waddle" : state === "success" ? "anim-duck-thumbs" : "anim-float"}
        style={{
          width: "200px",
          height: "auto",
          maxHeight: "235px",
          objectFit: "contain",
          filter: currentGlow,
          pointerEvents: "auto",
        }}
      />
    </div>
  );
}
