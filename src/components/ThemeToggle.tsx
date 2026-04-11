"use client";

import { useTheme } from "./ThemeProvider";
import { useState, useRef, useEffect } from "react";

const themes = [
  {
    value: "light" as const,
    label: "Light",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  {
    value: "dark" as const,
    label: "Dark",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
  },
  {
    value: "system" as const,
    label: "System",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = themes.find((t) => t.value === theme) ?? themes[2];

  return (
    <div ref={ref} className="relative" id="theme-toggle">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-8 h-8 rounded-[0.125rem] transition-all hover:scale-110"
        style={{
          color: "var(--text-muted)",
          backgroundColor: "var(--bg-card)",
        }}
        aria-label={`Theme: ${current.label}`}
        title={`Theme: ${current.label}`}
      >
        {current.icon}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 rounded-[0.125rem] overflow-hidden z-50"
          style={{
            backgroundColor: "var(--bg-card)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            border: "1px solid var(--border-ghost)",
            minWidth: "140px",
          }}
        >
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTheme(t.value);
                setOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
              style={{
                color:
                  theme === t.value
                    ? "#00f0ff"
                    : "var(--text-secondary)",
                backgroundColor:
                  theme === t.value
                    ? "var(--bg-card-hover)"
                    : "transparent",
                fontFamily: "var(--font-inter)",
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
