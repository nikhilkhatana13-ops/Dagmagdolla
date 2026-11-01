"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseCoordinateInput } from "@/lib/validation";
import { FEATURED_TARGETS } from "@/lib/featured-targets";

const QUICK_TARGETS = FEATURED_TARGETS.slice(0, 4);

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const coords = parseCoordinateInput(query);
    if (!coords) {
      setError("Enter decimal degrees: RA (0–360), Dec (−90–90), separated by comma or space.");
      return;
    }
    setError("");
    router.push(`/explore?ra=${coords.ra}&dec=${coords.dec}`);
  }

  function applyTarget(ra: number, dec: number, name: string) {
    setQuery(`${ra}, ${dec}`);
    setError("");
    void name;
  }

  return (
    <div className="flex-1 flex flex-col starfield ir-glow">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 flex-1">
        <div className="relative z-10 max-w-3xl mx-auto">
          {/* Eyebrow */}
          <p className="tech-label mb-6" style={{ color: "var(--accent)" }}>
            ALL-SKY INFRARED SURVEY · 0.75–5 μm
          </p>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            See how the infrared sky{" "}
            <span style={{ color: "var(--accent)" }}>changes</span>
          </h1>

          <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
            SPHEREx re-scans the whole sky over time. Search an object or sky
            coordinates and explore how infrared sources move, brighten, or
            fade.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="w-full max-w-xl mx-auto mb-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="hero-search" className="sr-only">
                Sky coordinates (RA, Dec in decimal degrees)
              </label>
              <input
                id="hero-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search coordinates, e.g. 156.0933, -41.6447"
                className="flex-1 px-4 py-3 rounded-xl text-sm border"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
                aria-describedby={error ? "hero-search-error" : undefined}
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
              >
                Search
              </button>
            </div>
            {error && (
              <p id="hero-search-error" className="mt-2 text-sm text-red-400 text-left" role="alert">
                {error}
              </p>
            )}
          </form>

          {/* Quick target chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-10" role="list" aria-label="Quick targets">
            {QUICK_TARGETS.map((t) => (
              <button
                key={t.name}
                role="listitem"
                onClick={() => applyTarget(t.ra, t.dec, t.name)}
                className="px-3 py-1.5 rounded-full text-xs border transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
                style={{
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-muted)",
                  background: "var(--bg-card)",
                }}
              >
                {t.name}
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/explore"
              className="px-8 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
            >
              Explore the sky
            </Link>
            <Link
              href="/tour"
              className="px-8 py-3 rounded-xl text-sm font-medium border transition-all hover:bg-[var(--border-subtle)]"
              style={{
                borderColor: "var(--accent)",
                color: "var(--accent)",
              }}
            >
              Take the 3-minute tour
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 border-t border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto">
          <p className="tech-label text-center mb-8" style={{ color: "var(--accent)" }}>
            HOW IT WORKS
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Choose a sky position",
                desc: "Enter decimal-degree coordinates (RA, Dec) or pick a featured astronomical target.",
              },
              {
                step: "02",
                title: "Retrieve SPHEREx cutouts",
                desc: "Our server queries NASA/Caltech IRSA and fetches small FITS image cutouts centered on your target.",
              },
              {
                step: "03",
                title: "Compare epochs and wavelengths",
                desc: "Select two observations and compare them side-by-side, via a reveal slider, or in blink mode.",
              },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="p-6 rounded-xl border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
              >
                <p className="tech-label mb-3" style={{ color: "var(--accent)" }}>
                  STEP {step}
                </p>
                <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scientific disclaimer */}
      <section className="py-8 px-4 border-t border-[var(--border-subtle)]">
        <div className="max-w-3xl mx-auto">
          <div
            className="p-5 rounded-xl border"
            style={{ background: "rgba(130, 205, 247, 0.04)", borderColor: "var(--border-subtle)" }}
            role="note"
            aria-label="Scientific disclaimer"
          >
            <p className="tech-label mb-2" style={{ color: "var(--accent)" }}>
              ⚠ SCIENTIFIC DISCLAIMER
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              This tool is an exploratory visualization aid, not a validated
              scientific detection system. Any apparent differences between
              observations are described as{" "}
              <strong style={{ color: "var(--text-primary)" }}>candidate changes</strong>{" "}
              requiring scientific follow-up. Differences can result from moving
              solar-system objects, variable sources, noise, calibration
              differences, or image artifacts. No classifications are made by
              this tool.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
