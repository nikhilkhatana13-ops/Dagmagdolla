/**
 * GET /api/spherex/cutout?id=...&ra=...&dec=...&size=...
 *
 * Fetches a real FITS cutout from IRSA using a server-side opaque ID
 * (resolved from the pendingUrls registry populated during search).
 * Parses the FITS data and returns serializable pixel data for display.
 *
 * SSRF protection: we only request URLs that came from our own IRSA search
 * response and were stored in the server-side pendingUrls Map. The browser
 * only sends an opaque "id" string — never a raw URL.
 */

import type { NextRequest } from "next/server";
import { validateRA, validateDec, validateSize, CUTOUT_SIZE_DEFAULT } from "@/lib/validation";
import { fetchFitsCutout, pendingUrls } from "@/lib/irsa";
import { parseFitsForDisplay } from "@/lib/fits-display";
import type { ApiCutoutResponse } from "@/lib/types";

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;

  const id = searchParams.get("id");
  const rawRa = searchParams.get("ra");
  const rawDec = searchParams.get("dec");
  const rawSize = searchParams.get("size");

  if (!id) {
    return Response.json(
      { success: false, error: "Missing observation id.", code: "VALIDATION_ERROR" } satisfies ApiCutoutResponse,
      { status: 400 }
    );
  }

  const raResult = validateRA(rawRa);
  if (!raResult.valid) {
    return Response.json(
      { success: false, error: raResult.error || "Invalid RA", code: "VALIDATION_ERROR" } satisfies ApiCutoutResponse,
      { status: 400 }
    );
  }
  const decResult = validateDec(rawDec);
  if (!decResult.valid) {
    return Response.json(
      { success: false, error: decResult.error || "Invalid Dec", code: "VALIDATION_ERROR" } satisfies ApiCutoutResponse,
      { status: 400 }
    );
  }
  const sizeResult = validateSize(rawSize);
  if (!sizeResult.valid) {
    return Response.json(
      { success: false, error: sizeResult.error || "Invalid size", code: "VALIDATION_ERROR" } satisfies ApiCutoutResponse,
      { status: 400 }
    );
  }

  const ra = parseFloat(rawRa!);
  const dec = parseFloat(rawDec!);
  const size = rawSize ? parseFloat(rawSize) : CUTOUT_SIZE_DEFAULT;

  // Resolve opaque ID → IRSA URL (SSRF protection)
  const fitsUrl = pendingUrls.get(id);
  if (!fitsUrl) {
    return Response.json(
      {
        success: false,
        error:
          "Observation not found in server registry. Please re-run the search first.",
        code: "NOT_FOUND",
      } satisfies ApiCutoutResponse,
      { status: 404 }
    );
  }

  try {
    const buf = await fetchFitsCutout(fitsUrl, ra, dec, size);
    const imageData = parseFitsForDisplay(buf, false);

    // Uint8ClampedArray is not directly JSON-serializable — convert to plain array
    const serializable = {
      ...imageData,
      pixels: Array.from(imageData.pixels),
    };

    return Response.json(
      {
        success: true,
        imageData: serializable,
        observationId: id,
        ra,
        dec,
        size,
        retrievedAt: new Date().toISOString(),
      } satisfies ApiCutoutResponse,
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.toLowerCase().includes("abort") || message.toLowerCase().includes("timeout");
    const isFits = message.toLowerCase().includes("fits");

    console.error("[api/spherex/cutout] error:", message);

    return Response.json(
      {
        success: false,
        error: isTimeout
          ? "IRSA did not return the cutout in time. Please retry."
          : isFits
          ? `FITS parsing error: ${message}`
          : `Could not retrieve cutout: ${message}`,
        code: isTimeout ? "UPSTREAM_ERROR" : isFits ? "FITS_ERROR" : "UPSTREAM_ERROR",
      } satisfies ApiCutoutResponse,
      { status: 502 }
    );
  }
}
