"use client";
import React from "react";
import { useCursor } from "./CursorProvider";

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

export const Cursor: React.FC<{ visibleOnTouch?: boolean }> = ({
  visibleOnTouch = false,
}) => {
  const { pos, vel, pressed, hovering } = useCursor();

  const speed = Math.hypot(vel.x, vel.y);
  const scale = clamp(
    1 + Math.min(speed * 0.03, 0.6) + (pressed ? 0.25 : 0),
    0.8,
    2.2
  );
  const hoverScale = hovering === "none" ? 1 : 1.25;

  return (
    <>
      <style jsx global>{`
        html,
        body {
          cursor: ${visibleOnTouch ? "none" : "none"};
        }
        @media (hover: none) and (pointer: coarse) {
          html,
          body {
            cursor: auto;
          }
        }
      `}</style>

      <div
        aria-hidden
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          pointerEvents: "none",
          zIndex: 9999,
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) scale(${scale * hoverScale})`,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)", // soft transparent fill
            backdropFilter: "blur(8px)", // blurred background
            WebkitBackdropFilter: "blur(8px)", // Safari support
            boxShadow: "0 0 20px rgba(0,0,0,0.1)", // subtle glow
            transition: "transform 150ms ease, background 200ms ease",
          }}
        />
      </div>
    </>
  );
};
