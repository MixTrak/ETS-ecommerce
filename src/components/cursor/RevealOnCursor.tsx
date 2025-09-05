"use client";
import React, { useEffect } from "react";
import { useCursor } from "./CursorProvider";

export const RevealOnCursor: React.FC<{
  src: string;
  radius?: number;
  hardness?: number;
  opacity?: number;
  zIndex?: number;
}> = ({ src, radius = 180, hardness = 0.35, opacity = 1, zIndex = 5 }) => {
  const { raw } = useCursor();

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--cursor-x", `${raw.x}px`);
    r.style.setProperty("--cursor-y", `${raw.y}px`);
  }, [raw.x, raw.y]);

  const inner = Math.max(0, 1 - hardness) * 55;
  const outer = 100;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex,
        opacity,
        backgroundImage: `url(${src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        WebkitMaskImage: `radial-gradient(circle ${radius}px at var(--cursor-x) var(--cursor-y), rgba(0,0,0,1) ${inner}%, rgba(0,0,0,0) ${outer}%)`,
        maskImage: `radial-gradient(circle ${radius}px at var(--cursor-x) var(--cursor-y), rgba(0,0,0,1) ${inner}%, rgba(0,0,0,0) ${outer}%)`,
        transition: "opacity 200ms ease",
      }}
    />
  );
};
