"use client";

import React, { useState } from "react";
import Link from "next/link";

const STEPS = [
  {
    step: "01",
    tag: "INFRARED SPECTROSCOPY",
    title: "What Infrared Light Reveals",
    summary:
      "Infrared light penetrates dense cosmic dust clouds that block visible light, exposing hidden star nurseries and cool objects.",
    details: [
      "Visible light is readily scattered and absorbed by interstellar dust grains. Infrared wavelengths (0.75–5.0 μm) pass through this dust with minimal extinction.",
      "Cool cosmic structures—including brown dwarfs, protostars, interstellar water and carbon monoxide ices, and distant redshifted galaxies—radiate primarily in the infrared.",
      "SPHEREx (Spectro-Photometer for the History of the Universe, Epoch of Reionization and Ices Explorer) maps the entire sky in 102 near-infrared spectral bands.",
    ],
    highlight: "Seeing through obscuring cosmic dust to uncover the cool, hidden universe.",
  },
  {
    step: "02",
    tag: "MULTI-BAND SPECTRO-PHOTOMETRY",
    title: "Why SPHEREx Uses 102 Wavelength Bands",
    summary:
      "Unlike traditional broadband cameras, SPHEREx captures a continuous spectrum for every single pixel in the sky.",
    details: [
      "Traditional astronomical cameras capture broad color slices (e.g., Red, Green, Blue, or single infrared filters). SPHEREx utilizes linear variable filters (LVFs).",
      "As SPHEREx sweeps across the sky, every celestial source is recorded across 102 distinct narrow wavelength bands spanning 0.75 μm to 5.0 μm.",
      "This delivers 3D spectroscopic datacubes: measuring chemical fingerprints of interstellar ices, mapping cosmic large-scale structure 3D distances via redshifts, and charting cosmic light fluctuations.",
    ],
    highlight: "Every point in the sky obtains a 102-point infrared spectrum, not just a static photograph.",
  },
  {
    step: "03",
    tag: "TIME-DOMAIN ASTRONOMY",
    title: "How Repeated Surveys Reveal Motion & Variability",
    summary:
      "SPHEREx surveys the entire celestial sphere every six months, creating a dynamic sky time machine.",
    details: [
      "By continuously re-scanning identical regions of the sky across multiple operational epochs, astronomers can compare images separated by days, weeks, and months.",
      "High proper-motion nearby stars and Kuiper Belt / Solar System objects visibly shift positions between observation epochs.",
      "Variable stars (such as Mira long-period variables or young stellar objects) oscillate in brightness or display accretion flareups.",
      "Comparing these cutouts reveals candidate changes in real time across the survey.",
    ],
    highlight: "Transforming static sky atlases into an active time-domain infrared movie.",
  },
  {
    step: "04",
    tag: "SCIENTIFIC INTEGRITY",
    title: "Why Scientific Candidates Require Verification",
    summary:
      "Apparent differences in automated images are candidate changes—never instant discoveries.",
    details: [
      "An apparent difference between two infrared images can arise from numerous non-astrophysical sources: telescope pointing jitter, cosmetic detector artifacts, cosmic-ray hits, stray sunlight, or differences in spatial resolution and filter bandpass.",
      "Legitimate astronomical changes can be moving solar system asteroids, known flare stars, or variable background sources.",
      "Scientific protocol demands careful verification against ephemerides catalogs (e.g., Minor Planet Center) and multi-wavelength follow-up observations with ground and space telescopes.",
      "SPHEREx SkyViewer strictly tags variations as 'candidate changes' or 'possible moving objects'—upholding rigorous astronomical discipline.",
    ],
    highlight: "Honest science: distinguishing true astrophysical candidates from noise and artifacts.",
  },
];

export default function TourPage() {
  const [activeStep, setActiveStep] = useState(0);

  const cur = STEPS[activeStep];

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8">
      {/* Eyebrow and Title */}
      <div className="text-center space-y-2">
        <p className="tech-label" style={{ color: "var(--accent)" }}>
          EDUCATIONAL BRIEFING · 3-MINUTE GUIDED TOUR
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Understanding the Dynamic Infrared Cosmos
        </h1>
        <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
          Follow four foundational concepts behind NASA&apos;s SPHEREx mission and time-domain astronomy.
        </p>
      </div>

      {/* Step Selector Pills */}
      <div className="flex justify-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s, idx) => (
          <button
            key={s.step}
            onClick={() => setActiveStep(idx)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 shrink-0 ${
              activeStep === idx
                ? "bg-[var(--accent)] text-[var(--bg-primary)] border-transparent"
                : "border-[var(--border-subtle)] text-[var(--text-muted)] bg-[var(--bg-card)] hover:border-[var(--accent)] hover:text-white"
            }`}
          >
            <span>{s.step}</span>
            <span className="hidden sm:inline">{s.title.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Active Step Card */}
      <div
        className="p-6 sm:p-8 rounded-2xl border space-y-6"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
          <span className="tech-label" style={{ color: "var(--accent)" }}>
            STAGE {cur.step} / 04 · {cur.tag}
          </span>
          <span className="text-xs text-[var(--text-dim)] font-mono">
            Topic {activeStep + 1} of 4
          </span>
        </div>

        <h2 className="text-2xl font-bold text-white tracking-tight">{cur.title}</h2>

        <p className="text-base font-medium leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {cur.summary}
        </p>

        <div className="space-y-3">
          {cur.details.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {paragraph}
            </p>
          ))}
        </div>

        <div
          className="p-4 rounded-xl border text-sm font-medium"
          style={{
            background: "rgba(130, 205, 247, 0.05)",
            borderColor: "rgba(130, 205, 247, 0.2)",
            color: "var(--accent)",
          }}
        >
          💡 Key Takeaway: {cur.highlight}
        </div>

        {/* Stepper Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => setActiveStep((p) => Math.max(0, p - 1))}
            disabled={activeStep === 0}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
          >
            ← Previous
          </button>

          {activeStep < STEPS.length - 1 ? (
            <button
              onClick={() => setActiveStep((p) => Math.min(STEPS.length - 1, p + 1))}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90"
            >
              Next Concept →
            </button>
          ) : (
            <Link
              href="/explore"
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90"
            >
              Launch Interactive Explorer →
            </Link>
          )}
        </div>
      </div>

      {/* Final Callout to Explore */}
      <div
        className="p-6 rounded-xl border text-center space-y-3"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <h3 className="text-lg font-semibold text-white">Ready to examine the real data?</h3>
        <p className="text-xs text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
          Search real celestial coordinates from NASA/IPAC IRSA and inspect FITS cutouts across epochs and wavelengths.
        </p>
        <div className="pt-2">
          <Link
            href="/explore"
            className="inline-block px-8 py-3 rounded-xl text-sm font-semibold bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90 transition-all"
          >
            Go to SkyViewer Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
