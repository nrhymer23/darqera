"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";

const links = [
  { label: "30 Days", href: "/#series" },
  { label: "D", href: "/d", title: "Decentralization", color: "var(--d)", pillar: true },
  { label: "A", href: "/a", title: "AI", color: "var(--a)", pillar: true },
  { label: "R", href: "/r", title: "Reality", color: "var(--r)", pillar: true },
  { label: "Q", href: "/q", title: "Quantum", color: "var(--q)", pillar: true },
  { label: "Archive", href: "/archive" },
  { label: "About", href: "/about" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    !href.startsWith("/#") && href !== "/" && pathname.startsWith(href);

  return (
    <header className="site-nav">
      <nav className="site-nav__inner" aria-label="Main">
        <Link href="/" className="site-nav__mark" aria-label="DARQ Era home">
          DARQ<span>ERA</span>
        </Link>

        <ul className="site-nav__links">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                title={l.title}
                className={l.pillar ? "site-nav__pillar" : undefined}
                aria-current={isActive(l.href) ? "page" : undefined}
                style={l.color ? { color: l.color } : undefined}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="site-nav__right">
          <ThemeToggle />
          <a href="#subscribe" className="btn-cyan site-nav__sub">
            Subscribe
          </a>
          <button
            type="button"
            className="site-nav__menu"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            id="mobile-menu-toggle"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </nav>

      {open && (
        <ul id="mobile-menu" className="site-nav__mobile mobile-menu-enter">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} onClick={() => setOpen(false)}>
                <span style={l.color ? { color: l.color } : undefined}>{l.label}</span>
                {l.title && <span className="site-nav__mobile-sub">{l.title}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
