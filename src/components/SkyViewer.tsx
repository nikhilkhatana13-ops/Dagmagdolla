"use client";

/**
 * SkyViewer — renders a FITS-derived pixel array on an HTML canvas with pan/zoom.
 * Displays scientific metadata and source provenance.
 */

import { useRef, useEffect, useState, useCallback } from "react";
import type { FitsImageData, ObservationRecord } from "@/lib/types";

interface SkyViewerProps {
  imageData: FitsImageData | null;
  observation?: ObservationRecord | null;
  label?: string;
  showCrosshair?: boolean;
  className?: string;
}

function formatWavelength(emMin: number | null, emMax: number | null): string {
  if (emMin == null && emMax == null) return "—";
  const toMicron = (m: number) => (m * 1e6).toFixed(2) + " μm";
  if (emMin != null && emMax != null)
    return `${toMicron(emMin)} – ${toMicron(emMax)}`;
  if (emMin != null) return `≥ ${toMicron(emMin)}`;
  return `≤ ${toMicron(emMax!)}`;
}

function formatDate(iso: string): string {
  if (iso === "Unknown" || !iso) return "Unknown";
  try {
    return new Date(iso).toUTCString().replace(" GMT", " UTC");
  } catch {
    return iso;
  }
}

export default function SkyViewer({
  imageData,
  observation,
  label,
  showCrosshair = true,
  className = "",
}: SkyViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan/zoom state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Draw the image on canvas whenever imageData or transform changes
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert pixels to ImageData
    const imgWidth = imageData.width;
    const imgHeight = imageData.height;
    const iData = ctx.createImageData(imgWidth, imgHeight);
    // pixels is already RGBA — copy it
    const src = imageData.pixels;
    for (let i = 0; i < src.length; i++) {
      iData.data[i] = src[i];
    }

    // Draw scaled/panned image via offscreen canvas
    const offscreen = document.createElement("canvas");
    offscreen.width = imgWidth;
    offscreen.height = imgHeight;
    const offCtx = offscreen.getContext("2d")!;
    offCtx.putImageData(iData, 0, 0);

    const drawW = imgWidth * scale;
    const drawH = imgHeight * scale;
    const drawX = (canvas.width - drawW) / 2 + pan.x;
    const drawY = (canvas.height - drawH) / 2 + pan.y;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, drawX, drawY, drawW, drawH);

    // Crosshair
    if (showCrosshair) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.save();
      ctx.strokeStyle = "rgba(130, 205, 247, 0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, canvas.height);
      ctx.moveTo(0, cy);
      ctx.lineTo(canvas.width, cy);
      ctx.stroke();
      // Center reticle
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(130, 205, 247, 0.9)";
      ctx.lineWidth = 1.5;
      const r = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    // Scale bar (approximate)
    const pixScale = observation?.fov ? (observation.fov / imgWidth) * 3600 : null; // arcsec/px
    if (pixScale) {
      const barPixels = Math.min(80, canvas.width * 0.2);
      const barArcsec = barPixels * pixScale * scale;
      const barLabel =
        barArcsec >= 3600
          ? `${(barArcsec / 3600).toFixed(1)}°`
          : barArcsec >= 60
          ? `${(barArcsec / 60).toFixed(1)}′`
          : `${barArcsec.toFixed(0)}″`;

      ctx.save();
      const bx = 16;
      const by = canvas.height - 24;
      ctx.strokeStyle = "rgba(130, 205, 247, 0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + barPixels, by);
      ctx.stroke();
      ctx.fillStyle = "rgba(130, 205, 247, 0.9)";
      ctx.font = "10px monospace";
      ctx.fillText(barLabel, bx, by - 4);
      ctx.restore();
    }
  }, [imageData, scale, pan, showCrosshair, observation]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ro = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      draw();
    });
    ro.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    draw();
    return () => ro.disconnect();
  }, [draw]);

  // Mouse pan
  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }
  function onMouseUp() { dragging.current = false; }

  // Wheel zoom
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setScale((s) => Math.max(0.2, Math.min(10, s * factor)));
  }

  // Touch pan
  const lastTouch = useRef({ x: 0, y: 0 });
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
  }

  function resetView() {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative flex-1 rounded-xl overflow-hidden border"
        style={{
          background: "#050810",
          borderColor: "var(--border-subtle)",
          minHeight: 280,
          cursor: imageData ? "crosshair" : "default",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        role="img"
        aria-label={
          imageData
            ? `FITS visualization of SPHEREx observation${observation ? ` at RA ${observation.ra.toFixed(4)}° Dec ${observation.dec.toFixed(4)}°` : ""}`
            : "No image loaded"
        }
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Empty state */}
        {!imageData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-6">
            <svg
              className="w-12 h-12 mb-2"
              style={{ color: "var(--text-dim)" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M1 12h4M19 12h4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-sm" style={{ color: "var(--text-dim)" }}>
              No image loaded
            </p>
            <p className="text-xs" style={{ color: "var(--text-dim)" }}>
              Search for a target and select an observation
            </p>
          </div>
        )}

        {/* Demo badge */}
        {imageData?.isDemo && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-semibold"
            style={{ background: "rgba(234, 179, 8, 0.15)", color: "#fbbf24", border: "1px solid rgba(234, 179, 8, 0.3)" }}
          >
            DEMO DATA
          </div>
        )}

        {/* Label overlay */}
        {label && (
          <div
            className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs"
            style={{ background: "rgba(11,16,28,0.85)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
          >
            {label}
          </div>
        )}

        {/* Zoom controls */}
        {imageData && (
          <div className="absolute bottom-2 right-2 flex flex-col gap-1">
            {[
              { label: "+", action: () => setScale((s) => Math.min(10, s * 1.25)), aria: "Zoom in" },
              { label: "−", action: () => setScale((s) => Math.max(0.2, s / 1.25)), aria: "Zoom out" },
              { label: "⌂", action: resetView, aria: "Reset view" },
            ].map(({ label: l, action, aria }) => (
              <button
                key={aria}
                onClick={action}
                aria-label={aria}
                className="w-8 h-8 rounded-lg text-sm font-bold transition-colors hover:bg-[var(--accent)] hover:text-[var(--bg-primary)]"
                style={{
                  background: "rgba(11,16,28,0.85)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Metadata strip */}
      {(imageData || observation) && (
        <div
          className="mt-2 p-3 rounded-lg border grid grid-cols-2 sm:grid-cols-4 gap-2"
          style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
        >
          {observation && (
            <>
              <MetaItem label="OBS DATE" value={formatDate(observation.dateObs)} />
              <MetaItem label="POSITION" value={`RA ${observation.ra.toFixed(4)}° Dec ${observation.dec.toFixed(4)}°`} />
              <MetaItem label="WAVELENGTH" value={formatWavelength(observation.emMin, observation.emMax)} />
              <MetaItem label="COLLECTION" value={observation.collection} />
            </>
          )}
          {imageData && (
            <>
              <MetaItem label="STRETCH" value={imageData.stretch.toUpperCase()} />
              <MetaItem label="VMIN/VMAX" value={`${imageData.vmin.toExponential(2)} / ${imageData.vmax.toExponential(2)}`} />
              <MetaItem label="PIXELS" value={`${imageData.width}×${imageData.height}`} />
              <MetaItem
                label="SOURCE"
                value={imageData.isDemo ? "Demo (synthetic)" : "IRSA SPHEREx"}
              />
            </>
          )}
        </div>
      )}
      {imageData && (
        <p className="mt-1 text-xs text-center" style={{ color: "var(--text-dim)" }}>
          Visualization: 2nd–98th percentile clip, asinh stretch, false-color IR tint.
          Not natural-colour photography.
        </p>
      )}
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="tech-label mb-0.5">{label}</p>
      <p className="text-xs font-mono truncate" style={{ color: "var(--text-primary)" }} title={value}>
        {value}
      </p>
    </div>
  );
}
