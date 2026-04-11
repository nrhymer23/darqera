"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Home", href: "/" },
  { label: "D", href: "/d", title: "Decentralized" },
  { label: "A", href: "/a", title: "Artificial Intelligence" },
  { label: "R", href: "/r", title: "Reality" },
  { label: "Q", href: "/q", title: "Quantum" },
];

const pillarColors: Record<string, string> = {
  "/d": "text-[#dbfcff]",
  "/a": "text-[#a7ffb3]",
  "/r": "text-[#fff3f9]",
  "/q": "text-[#00f0ff]",
};

export default function Nav() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: "rgba(19,19,19,0.75)",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderBottom: "1px solid rgba(59,73,75,0.15)",
      }}
    >
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="font-[family-name:var(--font-space-grotesk)] font-bold text-lg tracking-tight text-[#00f0ff] hover:opacity-80 transition-opacity"
        >
          DARQ<span className="text-[#e5e2e1]"> ERA</span>
        </Link>

        {/* Tabs */}
        <ul className="flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href);
            const accentColor = pillarColors[tab.href] ?? "text-[#e5e2e1]";

            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  title={tab.title}
                  className={`
                    relative px-4 py-1.5 text-sm font-medium tracking-wide transition-colors
                    font-[family-name:var(--font-space-grotesk)]
                    ${isActive ? `${accentColor}` : "text-[#8a8a8a] hover:text-[#e5e2e1]"}
                  `}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                        tab.href === "/"
                          ? "bg-[#00f0ff]"
                          : tab.href === "/d"
                          ? "bg-[#dbfcff]"
                          : tab.href === "/a"
                          ? "bg-[#a7ffb3]"
                          : tab.href === "/r"
                          ? "bg-[#fff3f9]"
                          : "bg-[#00f0ff]"
                      }`}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
