"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";

const tabs = [
  { label: "Home", href: "/" },
  { label: "D", href: "/d", title: "Decentralized" },
  { label: "A", href: "/a", title: "Artificial Intelligence" },
  { label: "R", href: "/r", title: "Reality" },
  { label: "Q", href: "/q", title: "Quantum" },
];

const pillarColors: Record<string, string> = {
  "/": "#00f0ff",
  "/d": "#dbfcff",
  "/a": "#a7ffb3",
  "/r": "#fff3f9",
  "/q": "#00f0ff",
};

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "var(--bg-nav)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderBottom: "1px solid var(--bg-nav-border)",
        boxShadow: "var(--shadow-nav)",
      }}
    >
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
          style={{ color: "#00f0ff" }}
        >
          DARQ<span style={{ color: "var(--text-primary)" }}>ERA</span>
        </Link>

        {/* Desktop Tabs */}
        <ul className="hidden sm:flex items-center gap-2">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            const accent = pillarColors[tab.href] ?? "var(--text-primary)";

            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  title={tab.title}
                  className="relative px-4 py-1.5 text-sm font-medium tracking-wide transition-colors font-[family-name:var(--font-space-grotesk)]"
                  style={{
                    color: isActive ? accent : "var(--text-muted)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.target as HTMLElement).style.color =
                        "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.target as HTMLElement).style.color =
                        "var(--text-muted)";
                  }}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right side: theme toggle + mobile hamburger */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            id="mobile-menu-toggle"
          >
            <span
              className="block w-5 h-[2px] rounded-full transition-all"
              style={{
                backgroundColor: "var(--text-primary)",
                transform: mobileOpen
                  ? "rotate(45deg) translate(2px, 2px)"
                  : "none",
              }}
            />
            <span
              className="block w-5 h-[2px] rounded-full transition-all"
              style={{
                backgroundColor: "var(--text-primary)",
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              className="block w-5 h-[2px] rounded-full transition-all"
              style={{
                backgroundColor: "var(--text-primary)",
                transform: mobileOpen
                  ? "rotate(-45deg) translate(2px, -2px)"
                  : "none",
              }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="sm:hidden mobile-menu-enter"
          style={{
            backgroundColor: "var(--bg-card)",
            borderTop: "1px solid var(--border-ghost)",
          }}
        >
          <ul className="flex flex-col px-6 py-3">
            {tabs.map((tab) => {
              const isActive =
                tab.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(tab.href);
              const accent = pillarColors[tab.href] ?? "var(--text-primary)";

              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    title={tab.title}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 py-3 text-sm font-medium tracking-wide font-[family-name:var(--font-space-grotesk)]"
                    style={{
                      color: isActive ? accent : "var(--text-muted)",
                      borderLeft: isActive
                        ? `2px solid ${accent}`
                        : "2px solid transparent",
                      paddingLeft: "12px",
                    }}
                  >
                    {tab.label}
                    {tab.title && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {tab.title}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
