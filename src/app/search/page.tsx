"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FEATURED_TARGETS } from "@/lib/featured-targets";
import { validateRA, validateDec, parseCoordinateInput } from "@/lib/validation";

export default function SearchPage() {
  // Direct coordinate inputs
  const [ra, setRa] = useState("83.8221");
  const [dec, setDec] = useState("-5.3911");
  const [rawInput, setRawInput] = useState("");
  const [coordError, setCoordError] = useState("");

  // Object name resolver inputs
  const [objectName, setObjectName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolverError, setResolverError] = useState("");
  const [resolvedResult, setResolvedResult] = useState<{
    name: string;
    ra: number;
    dec: number;
    source: string;
  } | null>(null);

  // Handle single-line coordinate parser
  function handleQuickParse() {
    setCoordError("");
    if (!rawInput.trim()) return;
    const parsed = parseCoordinateInput(rawInput);
    if (!parsed) {
      setCoordError(
        "Invalid format. Enter RA (0–360) and Dec (−90–90) in decimal degrees, separated by space or comma."
      );
      return;
    }
    setRa(String(parsed.ra));
    setDec(String(parsed.dec));
  }

  // Handle Name Resolver
  async function handleResolve(e: React.FormEvent) {
    e.preventDefault();
    if (!objectName.trim()) return;

    setResolving(true);
    setResolverError("");
    setResolvedResult(null);

    try {
      const res = await fetch(`/api/resolver?name=${encodeURIComponent(objectName.trim())}`);
      const data = await res.json();
      if (!data.success) {
        setResolverError(data.error || "Object name could not be resolved.");
      } else {
        setResolvedResult({
          name: data.name,
          ra: data.ra,
          dec: data.dec,
          source: data.source,
        });
        // Populate coordinates
        setRa(String(data.ra));
        setDec(String(data.dec));
      }
    } catch {
      setResolverError("Network error while querying the astronomical resolver.");
    } finally {
      setResolving(false);
    }
  }

  function handleSelectTarget(t: (typeof FEATURED_TARGETS)[0]) {
    setRa(String(t.ra));
    setDec(String(t.dec));
    setRawInput(`${t.ra}, ${t.dec}`);
    setResolvedResult({
      name: t.name,
      ra: t.ra,
      dec: t.dec,
      source: "Featured Catalog",
    });
    setCoordError("");
    setResolverError("");
  }

  const raValidation = validateRA(ra);
  const decValidation = validateDec(dec);
  const isValid = raValidation.valid && decValidation.valid;

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-8">
      {/* Header */}
      <div>
        <p className="tech-label" style={{ color: "var(--accent)" }}>
          SPHEREx TARGET DISPATCH
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
          Coordinate & Object Search
        </h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Target a specific point on the celestial sphere using Equatorial J2000 decimal
          coordinates, or query documented astronomical catalogs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Direct Coordinate Entry */}
        <div
          className="p-6 rounded-xl border flex flex-col justify-between space-y-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h2 className="text-base font-semibold text-white">Direct Sky Coordinates</h2>
              <span className="tech-label" style={{ color: "var(--text-dim)" }}>
                ICRS J2000
              </span>
            </div>

            {/* Quick single line input */}
            <div>
              <label htmlFor="quick-coord" className="tech-label block mb-1">
                FAST PASTE (RA, DEC)
              </label>
              <div className="flex gap-2">
                <input
                  id="quick-coord"
                  type="text"
                  placeholder="e.g. 83.8221, -5.3911"
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border font-mono"
                  style={{
                    background: "var(--bg-primary)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="button"
                  onClick={handleQuickParse}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] hover:bg-[var(--border-subtle)] text-white"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Explicit fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="search-ra" className="tech-label block mb-1">
                  RIGHT ASCENSION (0–360°)
                </label>
                <input
                  id="search-ra"
                  type="number"
                  step="any"
                  min="0"
                  max="360"
                  value={ra}
                  onChange={(e) => setRa(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border font-mono"
                  style={{
                    background: "var(--bg-primary)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
                {!raValidation.valid && (
                  <p className="text-[11px] text-red-400 mt-1">{raValidation.error}</p>
                )}
              </div>

              <div>
                <label htmlFor="search-dec" className="tech-label block mb-1">
                  DECLINATION (−90–90°)
                </label>
                <input
                  id="search-dec"
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  value={dec}
                  onChange={(e) => setDec(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border font-mono"
                  style={{
                    background: "var(--bg-primary)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
                {!decValidation.valid && (
                  <p className="text-[11px] text-red-400 mt-1">{decValidation.error}</p>
                )}
              </div>
            </div>

            {coordError && (
              <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                {coordError}
              </p>
            )}
          </div>

          <Link
            href={isValid ? `/explore?ra=${ra}&dec=${dec}` : "#"}
            className={`w-full py-3 rounded-xl text-center text-sm font-semibold transition-all ${
              isValid
                ? "bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90 cursor-pointer"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            Explore Coordinates in SPHEREx
          </Link>
        </div>

        {/* Card 2: Astronomical Name Resolver */}
        <div
          className="p-6 rounded-xl border flex flex-col justify-between space-y-6"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h2 className="text-base font-semibold text-white">Target Name Lookup</h2>
              <span className="tech-label" style={{ color: "var(--text-dim)" }}>
                CDS SESAME / SIMBAD
              </span>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Astronomical name resolution utilizes public standard catalogs. Notice: Name resolution is limited to cataloged sources. Coordinate search will work even if resolver is unavailable.
            </p>

            <form onSubmit={handleResolve} className="space-y-2">
              <label htmlFor="obj-name" className="tech-label block">
                CATALOG IDENTIFIER OR COMMON NAME
              </label>
              <div className="flex gap-2">
                <input
                  id="obj-name"
                  type="text"
                  placeholder="e.g. Mira, M42, Crab Nebula"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border"
                  style={{
                    background: "var(--bg-primary)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
                <button
                  type="submit"
                  disabled={resolving || !objectName.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-50"
                >
                  {resolving ? "Resolving…" : "Lookup"}
                </button>
              </div>
            </form>

            {/* Resolved Coordinates Display */}
            {resolvedResult && (
              <div
                className="p-3 rounded-lg border text-xs space-y-1.5"
                style={{
                  background: "rgba(130, 205, 247, 0.05)",
                  borderColor: "rgba(130, 205, 247, 0.3)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="tech-label" style={{ color: "var(--accent)" }}>
                    RESOLVED TARGET
                  </span>
                  <span className="text-[10px] text-[var(--text-dim)]">{resolvedResult.source}</span>
                </div>
                <p className="font-semibold text-white">{resolvedResult.name}</p>
                <p className="font-mono text-[var(--accent)]">
                  RA {resolvedResult.ra.toFixed(4)}°, Dec {resolvedResult.dec.toFixed(4)}°
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Coordinates pre-filled into direct exploration panel.
                </p>
              </div>
            )}

            {resolverError && (
              <div
                className="p-3 rounded-lg border text-xs space-y-1"
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                }}
              >
                <p className="font-semibold">Resolver Message</p>
                <p>{resolverError}</p>
              </div>
            )}
          </div>

          <Link
            href={`/explore?ra=${ra}&dec=${dec}`}
            className="w-full py-3 rounded-xl text-center text-sm font-semibold border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg-primary)] transition-all"
          >
            Proceed to Explorer with Current Coordinates
          </Link>
        </div>
      </div>

      {/* Featured Targets Section */}
      <div
        className="p-6 rounded-xl border space-y-4"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          <div>
            <h2 className="text-base font-semibold text-white">Featured Astronomical Targets</h2>
            <p className="tech-label" style={{ color: "var(--text-dim)" }}>
              PRE-VERIFIED SKY POSITIONS WITH RICH INFRARED STRUCTURE
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURED_TARGETS.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => handleSelectTarget(t)}
              className="text-left p-3.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--accent)] transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-white group-hover:text-[var(--accent)] transition-colors">
                  {t.name}
                </span>
                <span className="tech-label text-[10px] px-1.5 py-0.5 rounded bg-[var(--border-subtle)]">
                  {t.type}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">
                {t.description}
              </p>
              <p className="font-mono text-[11px] text-[var(--accent-dim)]">
                {t.ra.toFixed(4)}°, {t.dec.toFixed(4)}°
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
