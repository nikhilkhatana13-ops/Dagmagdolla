"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ComparisonViewer from "@/components/ComparisonViewer";
import CandidatePanel from "@/components/CandidatePanel";
import { validateRA, validateDec, validateSize, CUTOUT_SIZE_DEFAULT } from "@/lib/validation";
import { generateDemoImage } from "@/lib/fits-display";
import type {
  ObservationRecord,
  FitsImageData,
  ApiSearchResponse,
  SearchResponse,
  ApiCutoutResponse,
} from "@/lib/types";

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [ra, setRa] = useState(() => searchParams.get("ra") || "83.8221");
  const [dec, setDec] = useState(() => searchParams.get("dec") || "-5.3911");
  const [size, setSize] = useState(() => searchParams.get("size") || String(CUTOUT_SIZE_DEFAULT));

  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "done" | "error">("idle");
  const [searchError, setSearchError] = useState("");
  const [records, setRecords] = useState<ObservationRecord[]>([]);

  const [obsA, setObsA] = useState<ObservationRecord | null>(null);
  const [imageA, setImageA] = useState<FitsImageData | null>(null);
  const [obsB, setObsB] = useState<ObservationRecord | null>(null);
  const [imageB, setImageB] = useState<FitsImageData | null>(null);

  const [loadingSlot, setLoadingSlot] = useState<"A" | "B" | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [retrievedAt, setRetrievedAt] = useState<string>("");

  // Sync state to URL without placing raw IRSA access URLs in URL
  const updateShareUrl = useCallback(
    (curRa: string, curDec: string, idA?: string, idB?: string) => {
      const p = new URLSearchParams();
      p.set("ra", curRa);
      p.set("dec", curDec);
      if (idA) p.set("obsA", idA);
      if (idB) p.set("obsB", idB);
      router.replace(`/compare?${p.toString()}`, { scroll: false });
    },
    [router]
  );

  const loadCutout = useCallback(
    async (
      obs: ObservationRecord,
      slot: "A" | "B",
      customRa?: number,
      customDec?: number,
      customSize?: number
    ) => {
      setLoadingSlot(slot);
      setServiceError(null);

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
          setServiceError(data.error);
        } else {
          const pixels = new Uint8ClampedArray(data.imageData.pixels as unknown as number[]);
          const fitsData: FitsImageData = { ...data.imageData, pixels };
          if (slot === "A") {
            setObsA(obs);
            setImageA(fitsData);
            updateShareUrl(String(cRa), String(cDec), obs.id, obsB?.id);
          } else {
            setObsB(obs);
            setImageB(fitsData);
            updateShareUrl(String(cRa), String(cDec), obsA?.id, obs.id);
          }
        }
      } catch {
        setServiceError("Network error retrieving FITS cutout.");
      } finally {
        setLoadingSlot(null);
      }
    },
    [ra, dec, size, obsA, obsB, updateShareUrl]
  );

  const handleSearch = useCallback(
    async (sRa: string, sDec: string, sSize: string, targetIdA?: string | null, targetIdB?: string | null) => {
      const valRa = validateRA(sRa);
      const valDec = validateDec(sDec);
      const valSize = validateSize(sSize);

      if (!valRa.valid || !valDec.valid || !valSize.valid) {
        setSearchStatus("error");
        setSearchError(valRa.error || valDec.error || valSize.error || "Invalid parameters");
        return;
      }

      setSearchStatus("searching");
      setSearchError("");
      setServiceError(null);

      try {
        const q = new URLSearchParams({ ra: sRa, dec: sDec, size: sSize });
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
          setRetrievedAt(sr.retrievedAt);

          // Auto-select records
          if (sr.records.length > 0) {
            const first = targetIdA ? sr.records.find((r) => r.id === targetIdA) || sr.records[0] : sr.records[0];
            loadCutout(first, "A", parseFloat(sRa), parseFloat(sDec), parseFloat(sSize));

            if (sr.records.length > 1) {
              const second = targetIdB
                ? sr.records.find((r) => r.id === targetIdB) || sr.records[1]
                : sr.records[1];
              loadCutout(second, "B", parseFloat(sRa), parseFloat(sDec), parseFloat(sSize));
            }
          }
        }
      } catch {
        setSearchStatus("error");
        setSearchError("Failed to reach IRSA SIA v2 search service.");
      }
    },
    [loadCutout]
  );

  const hasSearchedRef = React.useRef(false);
  useEffect(() => {
    if (hasSearchedRef.current) return;
    const qRa = searchParams.get("ra");
    const qDec = searchParams.get("dec");
    const qSize = searchParams.get("size");
    const qObsA = searchParams.get("obsA");
    const qObsB = searchParams.get("obsB");

    const activeRa = qRa || "83.8221";
    const activeDec = qDec || "-5.3911";
    const activeSize = qSize || String(CUTOUT_SIZE_DEFAULT);

    hasSearchedRef.current = true;
    const timer = setTimeout(() => {
      handleSearch(activeRa, activeDec, activeSize, qObsA, qObsB);
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams, handleSearch]);

  function loadDemoComparison() {
    setServiceError(null);
    setSearchError("");

    const demo1: ObservationRecord = {
      id: "demo-a",
      collection: "spherex_qr2",
      obsId: "SPHEREx_DEMO_2024A",
      dateObs: "2024-02-10T08:30:00Z",
      mjd: 60350.35,
      emMin: 0.75e-6,
      emMax: 1.1e-6,
      bandpassName: "SPHEREx Band 1",
      fov: 0.05,
      ra: parseFloat(ra),
      dec: parseFloat(dec),
      instrument: "SPHEREx",
      facility: "SPHEREx",
      calibLevel: 2,
      description: "Demo Reference Cutout",
    };

    const demo2: ObservationRecord = {
      id: "demo-b",
      collection: "spherex_qr2",
      obsId: "SPHEREx_DEMO_2024B",
      dateObs: "2024-08-25T14:15:00Z",
      mjd: 60547.59,
      emMin: 0.75e-6,
      emMax: 1.1e-6,
      bandpassName: "SPHEREx Band 1",
      fov: 0.05,
      ra: parseFloat(ra),
      dec: parseFloat(dec),
      instrument: "SPHEREx",
      facility: "SPHEREx",
      calibLevel: 2,
      description: "Demo Follow-up Cutout",
    };

    setRecords([demo1, demo2]);
    setObsA(demo1);
    setImageA(generateDemoImage(256, 256));
    setObsB(demo2);
    setImageB(generateDemoImage(256, 256));
    setSearchStatus("done");
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <p className="tech-label" style={{ color: "var(--accent)" }}>
            MULTI-EPOCH COMPARISON WORKBENCH
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            SPHEREx Sky Time Machine
          </h1>
        </div>

        {/* Shareable query params button */}
        <button
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              alert("Comparison workbench link copied to clipboard!");
            }
          }}
          className="px-4 py-2 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] hover:border-[var(--accent)] text-white transition-all self-start sm:self-auto flex items-center gap-1.5"
        >
          <span>🔗</span> Share View Link
        </button>
      </div>

      {/* Coordinate & Query Bar */}
      <div
        className="p-4 rounded-xl border flex flex-wrap items-end gap-3 text-xs"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div>
          <label htmlFor="cmp-ra" className="tech-label block mb-1">
            RA (DEG)
          </label>
          <input
            id="cmp-ra"
            type="number"
            step="any"
            value={ra}
            onChange={(e) => setRa(e.target.value)}
            className="px-3 py-1.5 rounded-lg border font-mono w-28"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div>
          <label htmlFor="cmp-dec" className="tech-label block mb-1">
            DEC (DEG)
          </label>
          <input
            id="cmp-dec"
            type="number"
            step="any"
            value={dec}
            onChange={(e) => setDec(e.target.value)}
            className="px-3 py-1.5 rounded-lg border font-mono w-28"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div>
          <label htmlFor="cmp-size" className="tech-label block mb-1">
            SIZE (DEG)
          </label>
          <input
            id="cmp-size"
            type="number"
            step="0.01"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="px-3 py-1.5 rounded-lg border font-mono w-24"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <button
          onClick={() => handleSearch(ra, dec, size)}
          disabled={searchStatus === "searching"}
          className="px-4 py-2 rounded-lg font-semibold bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90 disabled:opacity-50"
        >
          {searchStatus === "searching" ? "Searching…" : "Search Pair"}
        </button>

        {searchStatus === "error" && (
          <div className="flex items-center gap-2 text-red-400">
            <span>{searchError}</span>
            <button
              onClick={loadDemoComparison}
              className="text-amber-400 underline font-medium"
            >
              Load Demo Comparison
            </button>
          </div>
        )}
      </div>

      {/* Observation Selectors for Slot A and Slot B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selector A */}
        <div
          className="p-4 rounded-xl border space-y-2"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between">
            <span className="tech-label" style={{ color: "var(--accent)" }}>
              SELECT OBSERVATION A (REFERENCE)
            </span>
            {loadingSlot === "A" && <span className="text-xs text-[var(--accent)]">Loading FITS…</span>}
          </div>
          <select
            value={obsA?.id || ""}
            onChange={(e) => {
              const selected = records.find((r) => r.id === e.target.value);
              if (selected) loadCutout(selected, "A");
            }}
            className="w-full px-3 py-2 rounded-lg border text-xs font-mono"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">-- Choose Observation A --</option>
            {records.map((r) => (
              <option key={`a-${r.id}`} value={r.id}>
                {r.dateObs.slice(0, 10)} | {r.obsId} ({r.collection})
              </option>
            ))}
          </select>
          {obsA && (
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Date: {obsA.dateObs} · {obsA.bandpassName || "Standard"}
            </p>
          )}
        </div>

        {/* Selector B */}
        <div
          className="p-4 rounded-xl border space-y-2"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between">
            <span className="tech-label" style={{ color: "#34d399" }}>
              SELECT OBSERVATION B (COMPARISON)
            </span>
            {loadingSlot === "B" && <span className="text-xs text-emerald-400">Loading FITS…</span>}
          </div>
          <select
            value={obsB?.id || ""}
            onChange={(e) => {
              const selected = records.find((r) => r.id === e.target.value);
              if (selected) loadCutout(selected, "B");
            }}
            className="w-full px-3 py-2 rounded-lg border text-xs font-mono"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">-- Choose Observation B --</option>
            {records.map((r) => (
              <option key={`b-${r.id}`} value={r.id}>
                {r.dateObs.slice(0, 10)} | {r.obsId} ({r.collection})
              </option>
            ))}
          </select>
          {obsB && (
            <p className="text-[11px] text-[var(--text-muted)] font-mono">
              Date: {obsB.dateObs} · {obsB.bandpassName || "Standard"}
            </p>
          )}
        </div>
      </div>

      {serviceError && (
        <div
          className="p-3 rounded-lg border text-xs text-red-400 flex items-center justify-between"
          style={{ background: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.3)" }}
        >
          <span>{serviceError}</span>
          <button onClick={loadDemoComparison} className="underline text-amber-300">
            Use demo fallback
          </button>
        </div>
      )}

      {/* Main Interactive Comparison View */}
      <div
        className="p-4 sm:p-6 rounded-xl border"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <ComparisonViewer
          imageA={imageA}
          imageB={imageB}
          obsA={obsA}
          obsB={obsB}
          className="min-h-[500px]"
        />
      </div>

      {/* Detailed Provenance Panel */}
      <div
        className="p-5 rounded-xl border space-y-4"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          <h2 className="text-sm font-semibold text-white">Full Provenance & Archive Trace</h2>
          <span className="tech-label" style={{ color: "var(--text-dim)" }}>
            NASA / CALTECH IPAC IRSA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="tech-label block mb-1">TARGET COORDINATES</span>
            <p className="text-white">RA: {parseFloat(ra).toFixed(4)}°</p>
            <p className="text-white">Dec: {parseFloat(dec).toFixed(4)}°</p>
            <p className="text-[var(--text-dim)]">ICRS J2000</p>
          </div>

          <div>
            <span className="tech-label block mb-1">CUTOUT SPECIFICATION</span>
            <p className="text-white">Angular Size: {size}°</p>
            <p className="text-white">Query Mode: Circle Cutout</p>
            <p className="text-[var(--text-dim)]">Extracted Server-side</p>
          </div>

          <div>
            <span className="tech-label block mb-1">RETRIEVAL TIMESTAMP</span>
            <p className="text-white">{retrievedAt || "Direct Session"}</p>
            <p className="text-[var(--text-muted)]">IRSA SIA v2 Gateway</p>
          </div>

          <div>
            <span className="tech-label block mb-1">SSRF SECURITY</span>
            <p className="text-emerald-400">Validated Opaque Registry</p>
            <p className="text-[var(--text-dim)]">Upstream URLs Protected</p>
          </div>
        </div>
      </div>

      {/* Candidate Panel */}
      <CandidatePanel
        imageA={imageA}
        imageB={imageB}
        obsA={obsA}
        obsB={obsB}
      />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-sm text-[var(--text-dim)] font-mono">
          Loading SPHEREx Comparison Workbench…
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
