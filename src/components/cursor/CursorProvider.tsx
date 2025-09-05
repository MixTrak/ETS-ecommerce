"use client";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

type Vec2 = { x: number; y: number };

type CursorContextValue = {
  pos: Vec2;
  raw: Vec2;
  vel: Vec2;
  pressed: boolean;
  hovering: "none" | "link" | "button" | "image" | string;
  setHovering: (h: CursorContextValue["hovering"]) => void;
};

const CursorContext = createContext<CursorContextValue | null>(null);

const isInteractive = (el: Element | null): boolean => {
  if (!el) return false;
  if (el instanceof HTMLElement && el.dataset.cursor) return true;
  const tag = el.tagName.toLowerCase();
  if (["a", "button", "input", "select", "textarea", "summary", "label"].includes(tag)) return true;
  if (el.getAttribute("role") === "button" || el.getAttribute("role") === "link") return true;
  return false;
};

export const CursorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pressed, setPressed] = useState(false);
  const [hovering, setHovering] = useState<CursorContextValue["hovering"]>("none");
  const [raw, setRaw] = useState<Vec2>({ x: 0, y: 0 });
  const [pos, setPos] = useState<Vec2>({ x: 0, y: 0 });
  const [vel, setVel] = useState<Vec2>({ x: 0, y: 0 });

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<{ t: number; x: number; y: number }>({ t: 0, x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onMove = (e: MouseEvent) => setRaw({ x: e.clientX, y: e.clientY });
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);
    const onOver = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      setHovering(
        isInteractive(el)
          ? el instanceof HTMLElement && el.dataset.cursor
            ? el.dataset.cursor
            : "link"
          : "none"
      );
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    window.addEventListener("mousemove", onOver, { passive: true });

    const tick = (t: number) => {
      const kFollow = 0.18;
      setPos((p) => ({ x: p.x + (raw.x - p.x) * kFollow, y: p.y + (raw.y - p.y) * kFollow }));

      const dt = Math.max(1, t - (lastRef.current.t || t));
      const vx = (raw.x - lastRef.current.x) / dt;
      const vy = (raw.y - lastRef.current.y) / dt;
      setVel({ x: vx, y: vy });
      lastRef.current = { t, x: raw.x, y: raw.y };
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onOver);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [raw.x, raw.y]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const r = document.documentElement;
    r.style.setProperty("--cursor-x", `${raw.x}px`);
    r.style.setProperty("--cursor-y", `${raw.y}px`);
  }, [raw.x, raw.y]);

  const value = useMemo<CursorContextValue>(
    () => ({ pos, raw, vel, pressed, hovering, setHovering }),
    [pos, raw, vel, pressed, hovering]
  );
  return <CursorContext.Provider value={value}>{children}</CursorContext.Provider>;
};

export const useCursor = () => {
  const ctx = useContext(CursorContext);
  if (!ctx) throw new Error("useCursor must be used within <CursorProvider>");
  return ctx;
};
