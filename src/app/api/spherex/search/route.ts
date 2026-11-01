/**
 * GET /api/spherex/search?ra=...&dec=...&size=...
 *
 * Validates coordinates, queries IRSA SIA v2 for SPHEREx observations,
 * and returns normalized metadata. Never exposes raw IRSA URLs to the browser.
 */

import type { NextRequest } from "next/server";
import { validateRA, validateDec, validateSize, CUTOUT_SIZE_DEFAULT, MAX_RECORDS } from "@/lib/validation";
import { searchIrsa } from "@/lib/irsa";
import type { ApiSearchResponse } from "@/lib/types";

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;

  const rawRa = searchParams.get("ra");
  const rawDec = searchParams.get("dec");
  const rawSize = searchParams.get("size");

  // Validate
  const raResult = validateRA(rawRa);
  if (!raResult.valid) {
    return Response.json(
      { success: false, error: raResult.error || "Invalid RA", code: "VALIDATION_ERROR" } satisfies ApiSearchResponse,
      { status: 400 }
    );
  }
  const decResult = validateDec(rawDec);
  if (!decResult.valid) {
    return Response.json(
      { success: false, error: decResult.error || "Invalid Dec", code: "VALIDATION_ERROR" } satisfies ApiSearchResponse,
      { status: 400 }
    );
  }
  const sizeResult = validateSize(rawSize);
  if (!sizeResult.valid) {
    return Response.json(
      { success: false, error: sizeResult.error || "Invalid size", code: "VALIDATION_ERROR" } satisfies ApiSearchResponse,
      { status: 400 }
    );
  }

  const ra = parseFloat(rawRa!);
  const dec = parseFloat(rawDec!);
  const size = rawSize ? parseFloat(rawSize) : CUTOUT_SIZE_DEFAULT;

  try {
    const records = await searchIrsa(ra, dec, size, MAX_RECORDS);

    if (records.length === 0) {
      return Response.json(
        {
          success: false,
          error:
            "No SPHEREx observations found covering this position. " +
            "SPHEREx data is being released incrementally — try a different region or check back later.",
          code: "NO_COVERAGE",
        } satisfies ApiSearchResponse,
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        records,
        total: records.length,
        ra,
        dec,
        size,
        retrievedAt: new Date().toISOString(),
      } satisfies ApiSearchResponse,
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.toLowerCase().includes("abort") || message.toLowerCase().includes("timeout");

    console.error("[api/spherex/search] upstream error:", message);

    return Response.json(
      {
        success: false,
        error: isTimeout
          ? "IRSA did not respond in time. Please retry."
          : `Could not reach IRSA: ${message}`,
        code: isTimeout ? "TIMEOUT" : "UPSTREAM_ERROR",
      } satisfies ApiSearchResponse,
      { status: 502 }
    );
  }
}
