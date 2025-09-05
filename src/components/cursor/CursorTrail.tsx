"use client";
import React, { useEffect, useRef } from "react";
import { useCursor } from "./CursorProvider";

export const CursorTrail: React.FC<{ count?: number; lifeMs?: number }> = ({ count = 18, lifeMs = 550 }) => {
  const { raw } = useCursor();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const parts = useRef(Array.from({ length: count }, () => ({ x: 0, y: 0, a: 0 })));
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fit = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    fit();
    window.addEventListener("resize", fit);

    const tick = () => {
      parts.current.pop();
      parts.current.unshift({ x: raw.x, y: raw.y, a: 1 });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < parts.current.length; i++) {
        const p = parts.current[i];
        const t = i / parts.current.length;
        const r = 8 * (1 - t);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(1 - t) * 0.22})`;
        ctx.fill();
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", fit);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [raw.x, raw.y]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9998, mixBlendMode: "screen" }}
      aria-hidden
    />
  );
};
