import type { NextRequest } from "next/server";
import { FEATURED_TARGETS } from "@/lib/featured-targets";

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name")?.trim();

  if (!name) {
    return Response.json(
      { success: false, error: "Missing object name query parameter." },
      { status: 400 }
    );
  }

  // 1. Check local catalog first (instant & reliable)
  const queryLower = name.toLowerCase();
  const matched = FEATURED_TARGETS.find(
    (t) =>
      t.name.toLowerCase() === queryLower ||
      t.name.toLowerCase().startsWith(queryLower) ||
      t.name.toLowerCase().includes(queryLower) ||
      queryLower.includes(t.name.toLowerCase())
  );
  if (matched) {
    return Response.json({
      success: true,
      name: matched.name,
      ra: matched.ra,
      dec: matched.dec,
      source: "Local Catalog",
    });
  }

  // 2. Query CDS Sesame astronomical name resolver (public astronomical standard)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    // Sesame ASCII output format: -oI/A
    const url = `https://cds.unistra.fr/cgi-bin/nph-sesame/-oI/A?${encodeURIComponent(name)}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Sesame service responded with status ${res.status}`);
    }

    const text = await res.text();
    // Look for %J line: %J 083.82208 -05.39111
    const match = text.match(/%J\s+([\d.]+)\s+([+-]?[\d.]+)/);
    if (match) {
      const ra = parseFloat(match[1]);
      const dec = parseFloat(match[2]);
      if (!isNaN(ra) && !isNaN(dec)) {
        return Response.json({
          success: true,
          name,
          ra,
          dec,
          source: "CDS Sesame / SIMBAD",
        });
      }
    }

    return Response.json({
      success: false,
      error: `Could not resolve astronomical object '${name}'. Name resolution is limited. Please specify decimal coordinates directly.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({
      success: false,
      error: `Resolver lookup failed (${msg}). Please specify coordinates manually.`,
    });
  }
}
