"use client";

import { useEffect, useState } from "react";

interface ViewCounterProps {
  slug: string;
  initialCount?: number;
  /** A2: count views silently (public view counts were dropped). */
  hidden?: boolean;
}

export default function ViewCounter({
  slug,
  initialCount = 0,
  hidden = false,
}: ViewCounterProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    // Only fire once per session per slug
    const sessionKey = `darqera-viewed-${slug}`;
    if (sessionStorage.getItem(sessionKey)) return;

    async function trackView() {
      try {
        const res = await fetch("/api/views", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.view_count !== undefined) {
            setCount(data.view_count);
          }
        }

        sessionStorage.setItem(sessionKey, "1");
      } catch {
        // Silently fail — views are non-critical
      }
    }

    trackView();
  }, [slug]);

  if (hidden || count === 0) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] tracking-wide"
      style={{ color: "var(--text-muted)" }}
    >
      {/* Eye icon */}
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {count.toLocaleString()}
    </span>
  );
}
