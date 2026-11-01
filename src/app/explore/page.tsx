"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import SkyViewer from "@/components/SkyViewer";
import ComparisonViewer from "@/components/ComparisonViewer";
import CandidatePanel from "@/components/CandidatePanel";
import { FEATURED_TARGETS } from "@/lib/featured-targets";
import { CUTOUT_SIZE_DEFAULT, validateRA, validateDec, validateSize } from "@/lib/validation";
import { generateDemoImage } from "@/lib/fits-display";
import type {
  ObservationRecord,
  FitsImageData,
  ApiSearchResponse,
  SearchResponse,
  ApiCutoutResponse,
} from "@/lib/types";

function ExploreContent() {
  const searchParams = useSearchParams();

  // Coordinates & controls
  const [ra, setRa] = useState(() => searchParams.get("ra") || "83.8221");
  const [dec, setDec] = useState(() => searchParams.get("dec") || "-5.3911");
  const [size, setSize] = useState(() => searchParams.get("size") || String(CUTOUT_SIZE_DEFAULT));

  // Search state
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "done" | "error">("idle");
  const [searchError, setSearchError] = useState("");
  const [records, setRecords] = useState<ObservationRecord[]>([]);

  // Selection state
  const [selectedObsA, setSelectedObsA] = useState<ObservationRecord | null>(null);
  const [imageA, setImageA] = useState<FitsImageData | null>(null);
  const [selectedObsB, setSelectedObsB] = useState<ObservationRecord | null>(null);
  const [imageB, setImageB] = useState<FitsImageData | null>(null);

  const [loadingCutout, setLoadingCutout] = useState<string | null>(null);
  const [cutoutError, setCutoutError] = useState<string | null>(null);

  // View tabs in main viewer: "single" or "compare"
  const [activeTab, setActiveTab] = useState<"single" | "compare">("single");

  const fetchCutout = useCallback(
    async (
      obs: ObservationRecord,
      targetSlot: "A" | "B",
      customRa?: number,
      customDec?: number,
      customSize?: number
    ) => {
      setLoadingCutout(obs.id);
      setCutoutError(null);

      const cRa = customRa ?? parseFloat(ra);
      const cDec = customDec ?? parseFloat(dec);
      const cSize = customSize ?? parseFloat(size);

      try {
        const q = new URLSearchParams({
          id: obs.id,
          ra: String(cRa),
          dec: String(cDec),
          size: String(cSize),
        });

        const res = await fetch(`/api/spherex/cutout?${q.toString()}`);
        const data: ApiCutoutResponse = await res.json();

        if (!data.success) {
          setCutoutError(data.error);
        } else {
          const pixels = new Uint8ClampedArray(data.imageData.pixels as unknown as number[]);
          const fitsData: FitsImageData = {
            ...data.imageData,
            pixels,
          };
          if (targetSlot === "A") {
            setSelectedObsA(obs);
            setImageA(fitsData);
          } else {
            setSelectedObsB(obs);
            setImageB(fitsData);
          }
        }
      } catch {
        setCutoutError("Failed to download or decode FITS cutout from server.");
      } finally {
        setLoadingCutout(null);
      }
    },
    [ra, dec, size]
  );

  const handleSearch = useCallback(
    async (searchRa: string, searchDec: string, searchSize: string) => {
      const valRa = validateRA(searchRa);
      if (!valRa.valid) {
        setSearchStatus("error");
        setSearchError(valRa.error || "Invalid RA");
        return;
      }
      const valDec = validateDec(searchDec);
      if (!valDec.valid) {
        setSearchStatus("error");
        setSearchError(valDec.error || "Invalid Dec");
        return;
      }
      const valSize = validateSize(searchSize);
      if (!valSize.valid) {
        setSearchStatus("error");
        setSearchError(valSize.error || "Invalid size");
        return;
      }

      setSearchStatus("searching");
      setSearchError("");
      setCutoutError(null);

      try {
        const q = new URLSearchParams({
          ra: searchRa,
          dec: searchDec,
          size: searchSize,
        });
        const res = await fetch(`/api/spherex/search?${q.toString()}`);
        const data: ApiSearchResponse = await res.json();

        if (!data.success) {
          setSearchStatus("error");
          setSearchError(data.error);
          setRecords([]);
        } else {
          const sr = data as SearchResponse;
          setSearchStatus("done");
          setRecords(sr.records);
          // Automatically fetch first record
          if (sr.records.length > 0) {
            fetchCutout(sr.records[0], "A", parseFloat(searchRa), parseFloat(searchDec), parseFloat(searchSize));
            if (sr.records.length > 1) {
              fetchCutout(sr.records[1], "B", parseFloat(searchRa), parseFloat(searchDec), parseFloat(searchSize));
            }
          }
        }
      } catch {
        setSearchStatus("error");
        setSearchError("Network failure connecting to archive API service.");
      }
    },
    [fetchCutout]
  );

  // Read URL query parameters on initial mount
  const hasSearchedRef = React.useRef(false);
  useEffect(() => {
    if (hasSearchedRef.current) return;
    const qRa = searchParams.get("ra");
    const qDec = searchParams.get("dec");
    const qSize = searchParams.get("size");

    if (qRa && qDec) {
      hasSearchedRef.current = true;
      const timer = setTimeout(() => {
        handleSearch(qRa, qDec, qSize || String(CUTOUT_SIZE_DEFAULT));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, handleSearch]);

  function loadDemoData() {
    setCutoutError(null);
    setSearchError("");

    const demoObsA: ObservationRecord = {
      id: "demo-1",
      collection: "spherex_qr2_demo",
      obsId: "DEMO_EPOCH_1",
      dateObs: "2024-03-15T12:00:00Z",
      mjd: 60384.5,
      emMin: 0.75e-6,
      emMax: 1.1e-6,
      bandpassName: "Band 1 (0.75-1.1 μm)",
      fov: 0.05,
      ra: parseFloat(ra) || 83.8221,
      dec: parseFloat(dec) || -5.3911,
      instrument: "SPHEREx Imager",
      facility: "SPHEREx",
      calibLevel: 2,
      description: "Synthetic test cutout mimicking Orion candidate epoch 1",
    };

    const demoObsB: ObservationRecord = {
      id: "demo-2",
      collection: "spherex_qr2_demo",
      obsId: "DEMO_EPOCH_2",
      dateObs: "2024-09-18T12:00:00Z",
      mjd: 60571.5,
      emMin: 0.75e-6,
      emMax: 1.1e-6,
      bandpassName: "Band 1 (0.75-1.1 μm)",
      fov: 0.05,
      ra: parseFloat(ra) || 83.8221,
      dec: parseFloat(dec) || -5.3911,
      instrument: "SPHEREx Imager",
      facility: "SPHEREx",
      calibLevel: 2,
      description: "Synthetic test cutout mimicking Orion candidate epoch 2",
    };

    setRecords([demoObsA, demoObsB]);
    setSelectedObsA(demoObsA);
    setImageA(generateDemoImage(256, 256));
    setSelectedObsB(demoObsB);
    setImageB(generateDemoImage(256, 256));
    setSearchStatus("done");
  }

  function applyPreset(target: (typeof FEATURED_TARGETS)[0]) {
    setRa(String(target.ra));
    setDec(String(target.dec));
    handleSearch(String(target.ra), String(target.dec), size);
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="tech-label" style={{ color: "var(--accent)" }}>
              OBSERVATION WORKSPACE
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--border-subtle)] text-[var(--text-muted)]">
              IRSA SIA v2 Connected
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            SPHEREx Interactive Sky Explorer
          </h1>
        </div>

        {/* Mode tab switch */}
        <div className="flex bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "single"
                ? "bg-[var(--accent)] text-[var(--bg-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-white"
            }`}
          >
            Single Viewer
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "compare"
                ? "bg-[var(--accent)] text-[var(--bg-primary)] shadow-sm"
                : "text-[var(--text-muted)] hover:text-white"
            }`}
          >
            Comparison Suite
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls (320px) + Right Viewer */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Controls Column */}
        <div className="w-full lg:w-[320px] shrink-0 space-y-5">
          <div
            className="p-4 rounded-xl border space-y-4"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(ra, dec, size);
              }}
              className="space-y-3"
            >
              <p className="tech-label" style={{ color: "var(--accent)" }}>
                COORDINATE SEARCH
              </p>

              <div>
                <label htmlFor="exp-ra" className="tech-label block mb-1">
                  RIGHT ASCENSION (0–360°)
                </label>
                <input
                  id="exp-ra"
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
                  required
                />
              </div>

              <div>
                <label htmlFor="exp-dec" className="tech-label block mb-1">
                  DECLINATION (−90–90°)
                </label>
                <input
                  id="exp-dec"
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
                  required
                />
              </div>

              <div>
                <label htmlFor="exp-size" className="tech-label block mb-1">
                  CUTOUT RADIUS / SIZE (DEG)
                </label>
                <input
                  id="exp-size"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.5"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border font-mono"
                  style={{
                    background: "var(--bg-primary)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="pt-1 flex gap-2">
                <button
                  type="submit"
                  disabled={searchStatus === "searching"}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
                >
                  {searchStatus === "searching" ? "Querying IRSA…" : "Search Archives"}
                </button>
              </div>
            </form>

            {/* Quick Target Chips */}
            <div>
              <p className="tech-label mb-2" style={{ color: "var(--text-dim)" }}>
                FEATURED TARGETS
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FEATURED_TARGETS.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => applyPreset(t)}
                    className="px-2 py-1 rounded text-xs border transition-all hover:border-[var(--accent)] hover:text-white"
                    style={{
                      background: "var(--bg-primary)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Errors & Fallback */}
            {searchStatus === "error" && (
              <div
                className="p-3 rounded-lg border text-xs space-y-2"
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#f87171",
                }}
              >
                <p className="font-semibold">Query Message:</p>
                <p className="leading-relaxed">{searchError}</p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleSearch(ra, dec, size)}
                    className="underline text-white font-medium hover:text-[var(--accent)]"
                  >
                    Retry query
                  </button>
                  <span>·</span>
                  <button
                    onClick={loadDemoData}
                    className="underline text-[#fbbf24] font-medium"
                  >
                    View demo example
                  </button>
                </div>
              </div>
            )}

            {cutoutError && (
              <div
                className="p-3 rounded-lg border text-xs space-y-2"
                style={{
                  background: "rgba(234, 179, 8, 0.08)",
                  borderColor: "rgba(234, 179, 8, 0.3)",
                  color: "#fbbf24",
                }}
              >
                <p className="font-semibold">Cutout Service Alert:</p>
                <p className="leading-relaxed">{cutoutError}</p>
                <button
                  onClick={loadDemoData}
                  className="underline text-white font-medium"
                >
                  Load synthetic demo data
                </button>
              </div>
            )}
          </div>

          {/* Observations List */}
          <div
            className="p-4 rounded-xl border space-y-3"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center justify-between">
              <p className="tech-label" style={{ color: "var(--accent)" }}>
                AVAILABLE OBSERVATIONS
              </p>
              <span className="text-xs text-[var(--text-dim)] font-mono">
                {records.length} found
              </span>
            </div>

            {records.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--text-dim)]">
                {searchStatus === "searching" ? (
                  <p>Searching NASA/Caltech IRSA...</p>
                ) : (
                  <p>No observations loaded. Run a coordinate search or click a featured target.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {records.map((r) => {
                  const isA = selectedObsA?.id === r.id;
                  const isB = selectedObsB?.id === r.id;
                  const isLoading = loadingCutout === r.id;

                  return (
                    <div
                      key={r.id}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        isA
                          ? "border-[var(--accent)] bg-[rgba(130,205,247,0.08)]"
                          : isB
                          ? "border-emerald-500 bg-[rgba(16,185,129,0.08)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--text-dim)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-semibold text-white">
                          {r.dateObs ? r.dateObs.slice(0, 10) : "Observation"}
                        </span>
                        <div className="flex items-center gap-1">
                          {isA && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--accent)] text-[var(--bg-primary)] font-bold">
                              Slot A
                            </span>
                          )}
                          {isB && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-400 text-[var(--bg-primary)] font-bold">
                              Slot B
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[var(--text-muted)] truncate mb-2">
                        {r.collection} · {r.bandpassName || "Standard Band"}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchCutout(r, "A")}
                          disabled={isLoading}
                          className="flex-1 py-1 rounded border border-[var(--border-subtle)] text-[10px] uppercase font-mono hover:bg-[var(--border-subtle)] text-white"
                        >
                          {isLoading && isA ? "Loading…" : "Load into A"}
                        </button>
                        <button
                          onClick={() => fetchCutout(r, "B")}
                          disabled={isLoading}
                          className="flex-1 py-1 rounded border border-[var(--border-subtle)] text-[10px] uppercase font-mono hover:bg-[var(--border-subtle)] text-white"
                        >
                          {isLoading && isB ? "Loading…" : "Load into B"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Viewer & Analysis Column */}
        <div className="flex-1 w-full space-y-6 min-w-0">
          {activeTab === "single" ? (
            <div className="space-y-4">
              <div
                className="p-4 rounded-xl border flex flex-col"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Primary Science Viewer</h2>
                    <p className="tech-label" style={{ color: "var(--text-dim)" }}>
                      FITS CUTOUT DISPLAY (SLOT A)
                    </p>
                  </div>
                  {imageA?.isDemo && (
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Demo Fallback
                    </span>
                  )}
                </div>

                <SkyViewer
                  imageData={imageA}
                  observation={selectedObsA}
                  label={selectedObsA?.obsId || "Observation A"}
                  className="min-h-[460px]"
                />
              </div>

              {/* Provenance and Info Card */}
              <div
                className="p-4 rounded-xl border text-xs grid grid-cols-1 sm:grid-cols-3 gap-4"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
              >
                <div>
                  <span className="tech-label block mb-1">ARCHIVE DATA PROVENANCE</span>
                  <p className="text-white">NASA / IPAC Infrared Science Archive (IRSA)</p>
                  <p className="text-[var(--text-muted)]">Mission: SPHEREx All-Sky Survey</p>
                </div>
                <div>
                  <span className="tech-label block mb-1">PIXEL CALIBRATION NOTICE</span>
                  <p className="text-white">Visual Stretch: ASINH (2%–98% percentile)</p>
                  <p className="text-[var(--text-muted)]">
                    Raw values mapped to normalized brightness.
                  </p>
                </div>
                <div>
                  <span className="tech-label block mb-1">INTEGRITY & FOLLOW-UP</span>
                  <p className="text-white">Requires scientific follow-up</p>
                  <p className="text-[var(--text-muted)]">
                    Not natural color. Cutout generated server-side.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div
                className="p-4 rounded-xl border"
                style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Comparative Sky Time-Machine</h2>
                    <p className="tech-label" style={{ color: "var(--text-dim)" }}>
                      DUAL-EPOCH BLINK & DIFFERENCE VISUALIZATION
                    </p>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Slot A vs Slot B
                  </div>
                </div>

                <ComparisonViewer
                  imageA={imageA}
                  imageB={imageB}
                  obsA={selectedObsA}
                  obsB={selectedObsB}
                  className="min-h-[480px]"
                />
              </div>

              {/* Candidate Panel */}
              <CandidatePanel
                imageA={imageA}
                imageB={imageB}
                obsA={selectedObsA}
                obsB={selectedObsB}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-sm text-[var(--text-dim)] font-mono">
          Initializing SPHEREx Explorer…
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
