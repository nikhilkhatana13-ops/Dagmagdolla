/**
 * FITS image rendering utilities.
 *
 * We parse raw FITS binary data and produce normalized pixel arrays for canvas display.
 * Only the primary HDU (Header+Data Unit) is read — the one confirmed by the SPHEREx
 * IRSA archive as the science image for level-2 products.
 *
 * References:
 *   FITS standard: https://fits.gsfc.nasa.gov/standard40/fits_standard40aa-le.pdf
 *   SPHEREx data products: https://irsa.ipac.caltech.edu/data/SPHEREx/docs/cutout_tool.html
 */

import type { FitsImageData } from "./types";

/** FITS block size in bytes */
const BLOCK = 2880;

/** Parse a single 80-character FITS header card */
function parseCard(card: string): [string, string | number | boolean | null] {
  const key = card.slice(0, 8).trimEnd();
  const rest = card.slice(8);
  if (rest.slice(0, 2) !== "= ") return [key, null];
  const valueComment = rest.slice(2);
  // String value
  if (valueComment.trimStart().startsWith("'")) {
    const start = valueComment.indexOf("'") + 1;
    const end = valueComment.indexOf("'", start);
    return [key, end >= 0 ? valueComment.slice(start, end).trimEnd() : valueComment.slice(start).trimEnd()];
  }
  // Logical
  const trimmed = valueComment.trimStart();
  if (trimmed[0] === "T") return [key, true];
  if (trimmed[0] === "F") return [key, false];
  // Number
  const numStr = trimmed.split("/")[0].trim();
  const num = parseFloat(numStr);
  if (!isNaN(num)) return [key, num];
  return [key, null];
}

/** Parse a FITS primary header. Returns header map and byte offset to data. */
function parseFitsHeader(buf: ArrayBuffer): {
  header: Record<string, string | number | boolean | null>;
  dataOffset: number;
  naxis: number;
  naxis1: number;
  naxis2: number;
  bitpix: number;
  bzero: number;
  bscale: number;
} {
  const bytes = new Uint8Array(buf);
  const decoder = new TextDecoder("ascii");
  const header: Record<string, string | number | boolean | null> = {};
  let offset = 0;
  let end = false;

  while (!end) {
    if (offset + BLOCK > bytes.length) break;
    const block = decoder.decode(bytes.slice(offset, offset + BLOCK));
    for (let i = 0; i < 36; i++) {
      const card = block.slice(i * 80, (i + 1) * 80);
      const keyword = card.slice(0, 8).trimEnd();
      if (keyword === "END") { end = true; break; }
      if (keyword === "") continue;
      const [k, v] = parseCard(card);
      if (k) header[k] = v;
    }
    offset += BLOCK;
  }

  // Round offset up to next BLOCK boundary
  const dataOffset = offset; // already aligned (we consumed full 2880-byte blocks)

  const naxis = (header["NAXIS"] as number) ?? 0;
  const naxis1 = (header["NAXIS1"] as number) ?? 0;
  const naxis2 = (header["NAXIS2"] as number) ?? 0;
  const bitpix = (header["BITPIX"] as number) ?? 32;
  const bzero = (header["BZERO"] as number) ?? 0;
  const bscale = (header["BSCALE"] as number) ?? 1;

  return { header, dataOffset, naxis, naxis1, naxis2, bitpix, bzero, bscale };
}

/** Read raw pixel float values from FITS data section */
function readPixels(
  buf: ArrayBuffer,
  dataOffset: number,
  naxis1: number,
  naxis2: number,
  bitpix: number,
  bzero: number,
  bscale: number
): Float64Array {
  const count = naxis1 * naxis2;
  const result = new Float64Array(count);
  const view = new DataView(buf, dataOffset);

  for (let i = 0; i < count; i++) {
    let raw = 0;
    // FITS is big-endian
    switch (bitpix) {
      case 8:
        raw = view.getUint8(i);
        break;
      case 16:
        raw = view.getInt16(i * 2, false);
        break;
      case 32:
        raw = view.getInt32(i * 4, false);
        break;
      case -32:
        raw = view.getFloat32(i * 4, false);
        break;
      case -64:
        raw = view.getFloat64(i * 8, false);
        break;
      default:
        raw = 0;
    }
    result[i] = bscale * raw + bzero;
  }
  return result;
}

/** Compute percentile of a Float64Array */
function percentile(arr: Float64Array, p: number): number {
  const finite = Array.from(arr).filter((v) => isFinite(v));
  if (finite.length === 0) return 0;
  finite.sort((a, b) => a - b);
  const idx = Math.max(0, Math.floor((p / 100) * finite.length) - 1);
  return finite[idx];
}

/** asinh stretch: maps physical value → 0–1 */
function asinhStretch(v: number, vmin: number, vmax: number): number {
  const range = vmax - vmin;
  if (range === 0) return 0.5;
  const x = (v - vmin) / range; // 0–1 linear
  // Apply asinh for compression of dynamic range
  const a = 3; // softening parameter
  const stretched = Math.asinh(a * x) / Math.asinh(a);
  return Math.max(0, Math.min(1, stretched));
}

/**
 * Parse a FITS ArrayBuffer and return display-ready pixel data.
 * Uses asinh stretch with 2nd/98th percentile clipping.
 */
export function parseFitsForDisplay(
  buf: ArrayBuffer,
  isDemo = false
): FitsImageData {
  const { header, dataOffset, naxis, naxis1, naxis2, bitpix, bzero, bscale } =
    parseFitsHeader(buf);

  if (naxis < 2 || naxis1 === 0 || naxis2 === 0) {
    throw new Error(
      `Unexpected FITS structure: NAXIS=${naxis}, NAXIS1=${naxis1}, NAXIS2=${naxis2}`
    );
  }

  const rawPixels = readPixels(
    buf,
    dataOffset,
    naxis1,
    naxis2,
    bitpix,
    bzero,
    bscale
  );

  const vmin = percentile(rawPixels, 2);
  const vmax = percentile(rawPixels, 98);

  // Build Uint8ClampedArray in RGBA format for canvas ImageData
  const rgba = new Uint8ClampedArray(naxis1 * naxis2 * 4);
  for (let i = 0; i < naxis1 * naxis2; i++) {
    const v = rawPixels[i];
    const norm = isFinite(v) ? asinhStretch(v, vmin, vmax) : 0;
    // Apply a false-color teal/blue tint — characteristic of IR visualizations
    // Gray base with slight cool-blue bias
    const gray = Math.round(norm * 255);
    rgba[i * 4 + 0] = Math.round(gray * 0.85);        // R
    rgba[i * 4 + 1] = Math.round(gray * 0.92);        // G
    rgba[i * 4 + 2] = Math.min(255, Math.round(gray * 1.1)); // B (slight boost)
    rgba[i * 4 + 3] = 255; // A
  }

  return {
    pixels: rgba,
    width: naxis1,
    height: naxis2,
    stretch: "asinh",
    vmin,
    vmax,
    header,
    isDemo,
  };
}

/**
 * Generate a synthetic demo FITS-like image for fallback display.
 * Returns a FitsImageData with isDemo=true so the UI can badge it.
 */
export function generateDemoImage(width = 256, height = 256): FitsImageData {
  const rgba = new Uint8ClampedArray(width * height * 4);
  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      // Gaussian source at center
      const source = Math.exp(-r * r / (2 * 15 * 15));
      // Some random "background" stars
      const seed = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const noise = (seed - Math.floor(seed)) * 0.05;
      const star = Math.random() < 0.003 ? 0.8 : 0;
      const val = Math.min(1, source + noise + star);

      // IR false-color tint
      rgba[i + 0] = Math.round(val * 200);
      rgba[i + 1] = Math.round(val * 220);
      rgba[i + 2] = Math.round(val * 255);
      rgba[i + 3] = 255;
    }
  }

  return {
    pixels: rgba,
    width,
    height,
    stretch: "asinh",
    vmin: 0,
    vmax: 1,
    header: {
      SIMPLE: true,
      BITPIX: -32,
      NAXIS: 2,
      NAXIS1: width,
      NAXIS2: height,
      OBJECT: "DEMO",
      TELESCOP: "SPHEREx (demo)",
    },
    isDemo: true,
  };
}
