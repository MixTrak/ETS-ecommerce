"use client";
import React, { useRef } from "react";
import { useCursor } from "./CursorProvider";

export const Magnetic: React.FC<{ strength?: number; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>> = ({
  strength = 0.25,
  className,
  children,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { raw, setHovering } = useCursor();

  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = () => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (raw.x - cx) * strength;
    const dy = (raw.y - cy) * strength;
    el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  };

  const onLeave: React.MouseEventHandler<HTMLDivElement> = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate3d(0,0,0)";
    setHovering("none");
  };

  return (
    <div ref={ref} data-cursor="button" onMouseMove={onMouseMove} onMouseLeave={onLeave} className={className} {...rest}>
      {children}
    </div>
  );
};
