"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/search", label: "Search" },
  { href: "/compare", label: "Compare" },
  { href: "/tour", label: "Tour" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b border-[var(--border-subtle)] backdrop-blur-md"
      style={{ background: "rgba(11, 16, 28, 0.92)" }}
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Brand */}
        <Link
          href="/"
          className="flex flex-col leading-tight group"
          aria-label="SPHEREx SkyViewer home"
        >
          <span
            className="text-base font-semibold tracking-wide group-hover:text-[var(--accent)] transition-colors"
            style={{ color: "var(--text-primary)" }}
          >
            SPHEREx SkyViewer
          </span>
          <span className="tech-label" style={{ color: "var(--text-dim)" }}>
            NASA / JPL-Caltech
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1" role="list">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                role="listitem"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--accent)] text-[var(--bg-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-[var(--border-subtle)] transition-colors"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span
            className={`block h-0.5 w-5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
            style={{ color: "var(--text-primary)" }}
          />
          <span
            className={`block h-0.5 w-5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`}
            style={{ color: "var(--text-primary)" }}
          />
          <span
            className={`block h-0.5 w-5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            style={{ color: "var(--text-primary)" }}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-[var(--border-subtle)] px-4 pb-4 pt-2 flex flex-col gap-1"
        >
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--accent)] text-[var(--bg-primary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
