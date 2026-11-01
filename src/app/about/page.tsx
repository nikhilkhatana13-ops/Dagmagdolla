import React from "react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8">
      {/* Header */}
      <div>
        <p className="tech-label" style={{ color: "var(--accent)" }}>
          PROJECT SPECIFICATION & DISCLOSURES
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
          About SPHEREx SkyViewer
        </h1>
        <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          An open-science exploratory application created for the NASA Space Apps Challenge,
          enabling public exploration of public infrared survey data.
        </p>
      </div>

      {/* Attribution & Legal Notice */}
      <div
        className="p-6 rounded-xl border space-y-4"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <h2 className="text-base font-semibold text-white">Attribution & Disclaimer</h2>
        <div
          className="p-4 rounded-lg border font-mono text-xs space-y-1"
          style={{
            background: "var(--bg-primary)",
            borderColor: "var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        >
          <p>SPHEREx SkyViewer — NASA Space Apps Challenge concept</p>
          <p>Data accessed from NASA/Caltech IPAC IRSA</p>
          <p className="text-amber-300">Not an official NASA product</p>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          This application connects via server-side route handlers to NASA/Caltech IPAC Infrared Science Archive (IRSA) Simple Image Access (SIA v2) protocols and FITS cutout endpoints. All images visualized are false-color representations of calibrated scientific data.
        </p>
      </div>

      {/* Scientific Integrity Principles */}
      <div
        className="p-6 rounded-xl border space-y-4"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <h2 className="text-base font-semibold text-white">Scientific Integrity Principles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div
            className="p-3.5 rounded-lg border space-y-1.5"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}
          >
            <span className="tech-label" style={{ color: "var(--accent)" }}>
              HONEST TERMINOLOGY
            </span>
            <p className="text-white font-medium">Candidate Changes Only</p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              We never report claims like &quot;Planet X found&quot; or &quot;New Planet Discovered&quot;. Any apparent pixel differences or motion between epochs are categorized strictly as candidate variations requiring scientific follow-up.
            </p>
          </div>

          <div
            className="p-3.5 rounded-lg border space-y-1.5"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}
          >
            <span className="tech-label" style={{ color: "var(--accent)" }}>
              ERROR BOUNDS & ARTIFACTS
            </span>
            <p className="text-white font-medium">Noise & Instrumental Artifacts</p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Discrepancies in multi-epoch difference images are often caused by spacecraft pointing jitter, diffraction spikes, cosmic rays, solar system asteroids, or calibration variations.
            </p>
          </div>

          <div
            className="p-3.5 rounded-lg border space-y-1.5"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}
          >
            <span className="tech-label" style={{ color: "var(--accent)" }}>
              DATA SECURITY & INTEGRITY
            </span>
            <p className="text-white font-medium">SSRF-Protected Architecture</p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              All external requests to IRSA pass through server-side Next.js route handlers with strictly bounded coordinates and opaque IDs, preventing direct client exposure or arbitrary upstream proxy abuse.
            </p>
          </div>

          <div
            className="p-3.5 rounded-lg border space-y-1.5"
            style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}
          >
            <span className="tech-label" style={{ color: "var(--accent)" }}>
              ROBUST VISUALIZATION
            </span>
            <p className="text-white font-medium">Percentile Clipping & Asinh Stretch</p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Visualizations use 2% to 98% percentile clipping with an inverse hyperbolic sine (asinh) compression to reveal subtle faint structures alongside bright stars without saturation.
            </p>
          </div>
        </div>
      </div>

      {/* External Resources */}
      <div
        className="p-6 rounded-xl border space-y-3"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
      >
        <h2 className="text-base font-semibold text-white">External Scientific Authorities</h2>
        <ul className="text-xs space-y-2 text-[var(--text-muted)]">
          <li>
            •{" "}
            <a
              href="https://irsa.ipac.caltech.edu/Missions/spherex.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              NASA / Caltech IPAC IRSA SPHEREx Mission Archive
            </a>
          </li>
          <li>
            •{" "}
            <a
              href="https://spherex.caltech.edu/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              SPHEREx Official Caltech Science Site
            </a>
          </li>
          <li>
            •{" "}
            <a
              href="https://irsa.ipac.caltech.edu/data/SPHEREx/docs/cutout_tool.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              IRSA SPHEREx Image & Cutout Documentation
            </a>
          </li>
        </ul>
        <div className="pt-2">
          <Link
            href="/explore"
            className="inline-block px-5 py-2.5 rounded-lg text-xs font-semibold bg-[var(--accent)] text-[var(--bg-primary)] hover:opacity-90"
          >
            Open SkyViewer →
          </Link>
        </div>
      </div>
    </div>
  );
}
