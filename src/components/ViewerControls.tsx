"use client";

/**
 * ViewerControls — search form and observation list for the Explore page.
 */

import { useState } from "react";
import { FEATURED_TARGETS } from "@/lib/featured-targets";
import type { ObservationRecord, SearchResponse, ApiSearchResponse, FitsImageData, ApiCutoutResponse } from "@/lib/types";
import { CUTOUT_SIZE_DEFAULT } from "@/lib/validation";

interface ViewerControlsProps {
  onImageLoaded: (img: FitsImageData, obs: ObservationRecord) => void;
  onError: (msg: string) => void;
  selectedId: string | null;
  onSelectId: (id: string) => void;
}

interface SearchState {
  status: "idle" | "searching" | "done" | "error";
  records: ObservationRecord[];
  error: string;
  ra: number;
  dec: number;
  size: number;
}

function formatWavelength(emMin: number | null, emMax: number | null): string {
  if (emMin == null && emMax == null) return "—";
  const toMicron = (m: number) => (m * 1e6).toFixed(2);
  if (emMin != null && emMax != null)
    return `${toMicron(emMin)}–${toMicron(emMax)} μm`;
  if (emMin != null) return `≥${toMicron(emMin)} μm`;
  return `≤${toMicron(emMax!)} μm`;
}

export default function ViewerControls({
  onImageLoaded,
  onError,
  selectedId,
  onSelectId,
}: ViewerControlsProps) {
  const [ra, setRa] = useState("83.8221");
  const [dec, setDec] = useState("-5.3911");
  const [size, setSize] = useState(String(CUTOUT_SIZE_DEFAULT));
  const [search, setSearch] = useState<SearchState>({
    status: "idle",
    records: [],
    error: "",
    ra: 0,
    dec: 0,
    size: CUTOUT_SIZE_DEFAULT,
  });
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function runSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setSearch((s) => ({ ...s, status: "searching", error: "" }));
    try {
      const params = new URLSearchParams({ ra, dec, size });
      const res = await fetch(`/api/spherex/search?${params}`);
      const data: ApiSearchResponse = await res.json();
      if (!data.success) {
        setSearch((s) => ({ ...s, status: "error", error: data.error, records: [] }));
      } else {
        const sr = data as SearchResponse;
        setSearch({
          status: "done",
          records: sr.records,
          error: "",
          ra: sr.ra,
          dec: sr.dec,
          size: sr.size,
        });
      }
    } catch {
      setSearch((s) => ({
        ...s,
        status: "error",
        error: "Network error contacting local API. Is the dev server running?",
        records: [],
      }));
    }
  }

  async function loadCutout(obs: ObservationRecord) {
    onSelectId(obs.id);
    setLoadingId(obs.id);
    try {
      const params = new URLSearchParams({
        id: obs.id,
        ra: String(search.ra || obs.ra),
        dec: String(search.dec || obs.dec),
        size: String(search.size),
      });
      const res = await fetch(`/api/spherex/cutout?${params}`);
      const data: ApiCutoutResponse = await res.json();
      if (!data.success) {
        onError(data.error);
      } else {
        const pixels = new Uint8ClampedArray(data.imageData.pixels as unknown as number[]);
        onImageLoaded({ ...data.imageData, pixels }, obs);
      }
    } catch {
      onError("Network error loading cutout.");
    } finally {
      setLoadingId(null);
    }
  }

  function applyTarget(t: { ra: number; dec: number }) {
    setRa(String(t.ra));
    setDec(String(t.dec));
  }

  return (
    <aside
      className="flex flex-col gap-4 overflow-y-auto"
      aria-label="Search controls"
    >
      {/* Coordinate form */}
      <form onSubmit={runSearch} className="flex flex-col gap-3">
        <p className="tech-label" style={{ color: "var(--accent)" }}>
          COORDINATES (J2000 ICRS)
        </p>

        <div>
          <label htmlFor="ctrl-ra" className="tech-label block mb-1">
            RIGHT ASCENSION (0–360°)
          </label>
          <input
            id="ctrl-ra"
            type="number"
            min={0}
            max={360}
            step="any"
            value={ra}
            onChange={(e) => setRa(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
            required
          />
        </div>

        <div>
          <label htmlFor="ctrl-dec" className="tech-label block mb-1">
            DECLINATION (−90–90°)
          </label>
          <input
            id="ctrl-dec"
            type="number"
            min={-90}
            max={90}
            step="any"
            value={dec}
            onChange={(e) => setDec(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
            required
          />
        </div>

        <div>
          <label htmlFor="ctrl-size" className="tech-label block mb-1">
            CUTOUT SIZE (0.01–0.5°)
          </label>
          <input
            id="ctrl-size"
            type="number"
            min={0.01}
            max={0.5}
            step={0.01}
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm border"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={search.status === "searching"}
          className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
        >
          {search.status === "searching" ? "Searching IRSA…" : "Search SPHEREx"}
        </button>
      </form>

      {/* Featured targets */}
      <div>
        <p className="tech-label mb-2" style={{ color: "var(--text-dim)" }}>
          FEATURED TARGETS
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FEATURED_TARGETS.map((t) => (
            <button
              key={t.name}
              onClick={() => applyTarget(t)}
              className="px-2.5 py-1 rounded-lg text-xs border transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
              style={{
                borderColor: "var(--border-subtle)",
                color: "var(--text-muted)",
                background: "var(--bg-primary)",
              }}
              title={t.description}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search status */}
      {search.status === "error" && (
        <div
          className="p-3 rounded-lg border text-sm"
          style={{
            background: "rgba(239,68,68,0.08)",
            borderColor: "rgba(239,68,68,0.3)",
            color: "#f87171",
          }}
          role="alert"
        >
          <p className="font-semibold mb-1">Search failed</p>
          <p className="text-xs leading-relaxed">{search.error}</p>
          <button
            onClick={() => runSearch()}
            className="mt-2 text-xs underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results */}
      {search.status === "done" && (
        <div>
          <p className="tech-label mb-2" style={{ color: "var(--accent)" }}>
            {search.records.length} OBSERVATIONS FOUND
          </p>
          <ul className="flex flex-col gap-1.5" role="listbox" aria-label="Observations">
            {search.records.map((obs) => (
              <li key={obs.id} role="option" aria-selected={selectedId === obs.id}>
                <button
                  onClick={() => loadCutout(obs)}
                  disabled={loadingId === obs.id}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                    selectedId === obs.id
                      ? "border-[var(--accent)] bg-[rgba(130,205,247,0.08)]"
                      : "border-[var(--border-subtle)] hover:border-[var(--accent)]"
                  }`}
                  style={{
                    background: selectedId === obs.id ? undefined : "var(--bg-primary)",
                  }}
                >
                  <p className="font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
                    {loadingId === obs.id ? "Loading…" : obs.dateObs.slice(0, 10)}
                  </p>
                  <p style={{ color: "var(--text-muted)" }}>
                    {formatWavelength(obs.emMin, obs.emMax)} · {obs.collection}
                  </p>
                  {obs.bandpassName && (
                    <p style={{ color: "var(--text-dim)" }}>{obs.bandpassName}</p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
