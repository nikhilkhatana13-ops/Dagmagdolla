"use client";

import React from "react";
import type { FitsImageData, ObservationRecord } from "@/lib/types";

interface CandidatePanelProps {
  imageA: FitsImageData | null;
  imageB: FitsImageData | null;
  obsA?: ObservationRecord | null;
  obsB?: ObservationRecord | null;
}

interface DiffMetrics {
  meanDiff: number;
  maxDiff: number;
  rmsDiff: number;
  totalPixels: number;
  changedPixelsFraction: number;
  hasSignificantChange: boolean;
}

function computeMetrics(imgA: FitsImageData, imgB: FitsImageData): DiffMetrics | null {
  const w = Math.min(imgA.width, imgB.width);
  const h = Math.min(imgA.height, imgB.height);
  if (w === 0 || h === 0) return null;

  let sumDiff = 0;
  let sumSqDiff = 0;
  let maxD = 0;
  let changedCount = 0;
  const count = w * h;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idxA = (y * imgA.width + x) * 4;
      const idxB = (y * imgB.width + x) * 4;

      const grayA = (imgA.pixels[idxA] + imgA.pixels[idxA + 1] + imgA.pixels[idxA + 2]) / 3;
      const grayB = (imgB.pixels[idxB] + imgB.pixels[idxB + 1] + imgB.pixels[idxB + 2]) / 3;
      const diff = Math.abs(grayA - grayB);

      sumDiff += diff;
      sumSqDiff += diff * diff;
      if (diff > maxD) maxD = diff;
      if (diff > 25) { // notable threshold out of 255
        changedCount++;
      }
    }
  }

  const meanDiff = sumDiff / count;
  const rmsDiff = Math.sqrt(sumSqDiff / count);
  const changedPixelsFraction = changedCount / count;

  return {
    meanDiff,
    maxDiff: maxD,
    rmsDiff,
    totalPixels: count,
    changedPixelsFraction,
    hasSignificantChange: changedPixelsFraction > 0.005,
  };
}

export default function CandidatePanel({ imageA, imageB, obsA, obsB }: CandidatePanelProps) {
  const hasBothImages = !!imageA && !!imageB;
  const metrics = hasBothImages ? computeMetrics(imageA!, imageB!) : null;

  return (
    <div
      className="p-5 rounded-xl border flex flex-col gap-4"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            What changed?
          </h2>
          <p className="tech-label" style={{ color: "var(--text-dim)" }}>
            IMAGE-DIFFERENCE & CANDIDATE LOG
          </p>
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full border"
          style={{
            borderColor: "var(--border-subtle)",
            color: "var(--text-muted)",
            background: "var(--bg-primary)",
          }}
        >
          Exploratory analysis
        </span>
      </div>

      {!hasBothImages ? (
        <div className="py-6 text-center text-sm" style={{ color: "var(--text-dim)" }}>
          <p>Select and load two observations to evaluate candidate pixel differences.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Metadata comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div
              className="p-3 rounded-lg border"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}
            >
              <p className="tech-label mb-1" style={{ color: "var(--accent)" }}>
                OBSERVATION A
              </p>
              <p className="font-mono text-white">{obsA?.dateObs || "Unknown epoch"}</p>
              <p style={{ color: "var(--text-muted)" }}>{obsA?.obsId || "Product A"}</p>
              <p style={{ color: "var(--text-dim)" }}>
                {imageA?.width} × {imageA?.height} px · {imageA?.stretch}
              </p>
            </div>
            <div
              className="p-3 rounded-lg border"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}
            >
              <p className="tech-label mb-1" style={{ color: "var(--accent)" }}>
                OBSERVATION B
              </p>
              <p className="font-mono text-white">{obsB?.dateObs || "Unknown epoch"}</p>
              <p style={{ color: "var(--text-muted)" }}>{obsB?.obsId || "Product B"}</p>
              <p style={{ color: "var(--text-dim)" }}>
                {imageB?.width} × {imageB?.height} px · {imageB?.stretch}
              </p>
            </div>
          </div>

          {/* Measurements */}
          {metrics ? (
            <div
              className="p-4 rounded-lg border space-y-3"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}
            >
              <p className="tech-label" style={{ color: "var(--text-muted)" }}>
                PIXEL-LEVEL DIFFERENCE METRICS
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="tech-label block">MEAN DIFF</span>
                  <span className="font-mono text-white">{metrics.meanDiff.toFixed(2)} / 255</span>
                </div>
                <div>
                  <span className="tech-label block">RMS DIFF</span>
                  <span className="font-mono text-white">{metrics.rmsDiff.toFixed(2)}</span>
                </div>
                <div>
                  <span className="tech-label block">PEAK DIFF</span>
                  <span className="font-mono text-white">{metrics.maxDiff.toFixed(0)} / 255</span>
                </div>
                <div>
                  <span className="tech-label block">CHANGED PIXELS</span>
                  <span className="font-mono text-white">
                    {(metrics.changedPixelsFraction * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Honest scientific summary */}
              <div className="pt-2 border-t border-[var(--border-subtle)] text-xs space-y-1.5">
                <p className="tech-label" style={{ color: "var(--accent)" }}>
                  PRELIMINARY ASSESSMENT
                </p>
                {metrics.hasSignificantChange ? (
                  <div className="space-y-1">
                    <p style={{ color: "var(--text-primary)" }}>
                      • Detected <span className="font-semibold text-[var(--accent)]">candidate change</span> across compared epochs.
                    </p>
                    <p style={{ color: "var(--text-muted)" }}>
                      • Potential interpretation: <span className="text-white">possible moving object</span> or <span className="text-white">possible brightness variation</span>.
                    </p>
                    <p style={{ color: "#fbbf24" }}>
                      • Requires scientific follow-up to eliminate solar-system asteroids, pointing jitter, background noise, or reduction artifacts.
                    </p>
                  </div>
                ) : (
                  <p style={{ color: "var(--text-muted)" }}>
                    Comparison available; no reliable automated measurement was produced exceeding typical noise floors. Candidate changes remain below detectable sensitivity for this cutout pair.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div
              className="p-3 rounded-lg border text-xs"
              style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}
            >
              <p style={{ color: "var(--text-muted)" }}>
                Comparison available; no reliable automated measurement was produced.
              </p>
            </div>
          )}

          {/* Scientific integrity banner */}
          <div
            className="p-3 rounded-lg border text-xs leading-relaxed"
            style={{
              background: "rgba(130, 205, 247, 0.03)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            <strong className="text-white">Scientific Notice:</strong> This viewer identifies exploratory image differences. Candidate signals may stem from known or unknown solar system small bodies, intrinsic stellar variability, telescope dithering/PSF variations, stray light, or pipeline calibration residuals. It is not an automated discovery pipeline and does not certify new astronomical objects.
          </div>
        </div>
      )}
    </div>
  );
}
