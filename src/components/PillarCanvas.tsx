"use client";

import { useEffect, useRef } from "react";
import type { Pillar } from "@/types/post";

/**
 * Generative cover art keyed to a DARQ pillar. Each pillar gets its own
 * abstract visual language, drawn on canvas from the live theme tokens:
 *   D — decentralized node mesh
 *   A — drifting particle flow field
 *   R — refracted light / prism bands
 *   Q — quantum interference contours
 *
 * Animation pauses when off-screen and falls back to a single static frame
 * under prefers-reduced-motion.
 */

type Draw = (t: number) => void;

interface Dims {
  ctx: CanvasRenderingContext2D;
  W: number;
  H: number;
}

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return `rgba(255,255,255,${alpha})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function pillarColors(pillar: Pillar): { primary: string; secondary: string } {
  const cyan = readVar("--brand-cyan") || "#00f0ff";
  switch (pillar) {
    case "D":
      return { primary: readVar("--pillar-d") || "#00e5c4", secondary: cyan };
    case "A":
      return { primary: readVar("--pillar-a") || "#39ff8c", secondary: cyan };
    case "R":
      return { primary: readVar("--pillar-r") || "#ff3d8a", secondary: cyan };
    case "Q":
      return { primary: readVar("--pillar-q") || "#b366ff", secondary: cyan };
  }
}

/* ── per-pillar generators ───────────────────────────── */

function meshDraw(d: Dims, color: string): Draw {
  const count = Math.max(12, Math.round((d.W * d.H) / 9000));
  const pts = Array.from({ length: count }, () => ({
    x: Math.random() * d.W,
    y: Math.random() * d.H,
    vx: (Math.random() - 0.5) * 0.16,
    vy: (Math.random() - 0.5) * 0.16,
  }));
  return () => {
    const { ctx, W, H } = d;
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < 92) {
          ctx.strokeStyle = hexToRgba(color, (1 - dist / 92) * 0.3);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }
    for (const p of pts) {
      ctx.fillStyle = hexToRgba(color, 0.85);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

function particlesDraw(d: Dims, c1: string, c2: string): Draw {
  const count = Math.max(50, Math.round((d.W * d.H) / 1500));
  const ps = Array.from({ length: count }, () => ({
    x: Math.random() * d.W,
    y: Math.random() * d.H,
    r: Math.random() * 1.5 + 0.4,
    sp: Math.random() * 0.4 + 0.1,
  }));
  return (t) => {
    const { ctx, W, H } = d;
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) {
      const ang =
        Math.sin(p.x * 0.01 + t * 0.0004) + Math.cos(p.y * 0.012 - t * 0.0003);
      p.x += Math.cos(ang) * p.sp;
      p.y += Math.sin(ang) * p.sp + 0.05;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
      ctx.fillStyle = hexToRgba(Math.sin(p.x * 0.02) > 0 ? c1 : c2, 0.6);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };
}

function prismDraw(d: Dims, c1: string, c2: string): Draw {
  return (t) => {
    const { ctx, W, H } = d;
    ctx.clearRect(0, 0, W, H);
    const bands = 6;
    for (let i = 0; i < bands; i++) {
      const off = Math.sin(t * 0.0005 + i * 0.9) * 40;
      const x = (W / bands) * i + off;
      const color = i % 2 ? c1 : c2;
      const g = ctx.createLinearGradient(x, 0, x + W * 0.5, H);
      g.addColorStop(0, hexToRgba(color, 0));
      g.addColorStop(0.5, hexToRgba(color, 0.22));
      g.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + W * 0.28, 0);
      ctx.lineTo(x + W * 0.28 - 60, H);
      ctx.lineTo(x - 60, H);
      ctx.closePath();
      ctx.fill();
    }
  };
}

function wavesDraw(d: Dims, color: string): Draw {
  return (t) => {
    const { ctx, W, H } = d;
    ctx.clearRect(0, 0, W, H);
    const lines = 9;
    for (let l = 0; l < lines; l++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 6) {
        const y =
          H / 2 +
          Math.sin(x * 0.02 + t * 0.0012 + l * 0.7) * (10 + l * 3) +
          Math.sin(x * 0.045 - t * 0.0009 + l) * 8 -
          (l - lines / 2) * 10;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = hexToRgba(color, 0.1 + (l / lines) * 0.18);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  };
}

function buildDraw(pillar: Pillar, d: Dims): Draw {
  const { primary, secondary } = pillarColors(pillar);
  switch (pillar) {
    case "D":
      return meshDraw(d, primary);
    case "A":
      return particlesDraw(d, primary, secondary);
    case "R":
      return prismDraw(d, primary, secondary);
    case "Q":
      return wavesDraw(d, primary);
  }
}

export default function PillarCanvas({ pillar }: { pillar: Pillar }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const dims: Dims = { ctx, W: 0, H: 0 };
    let draw: Draw = () => {};

    const rebuild = () => {
      const r = canvas.getBoundingClientRect();
      dims.W = Math.max(1, r.width);
      dims.H = Math.max(1, r.height);
      canvas.width = dims.W * dpr;
      canvas.height = dims.H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw = buildDraw(pillar, dims);
      if (reduce) draw(1200);
    };
    rebuild();

    let raf = 0;
    let visible = true;
    const start = performance.now();
    const loop = (now: number) => {
      if (visible) draw(now - start);
      raf = requestAnimationFrame(loop);
    };
    if (!reduce) raf = requestAnimationFrame(loop);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "120px" },
    );
    io.observe(canvas);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(rebuild, 150);
    };
    window.addEventListener("resize", onResize);

    // Re-read colors when the theme (.dark class) toggles.
    const themeObserver = new MutationObserver(rebuild);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeTimer);
    };
  }, [pillar]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
