// Shared types for SPHEREx SkyViewer

export interface Coordinates {
  ra: number; // Right Ascension, decimal degrees, 0–360
  dec: number; // Declination, decimal degrees, -90–90
}

export interface SearchParams extends Coordinates {
  size: number; // Cutout size in degrees
}

/** One record returned from the IRSA SIA v2 search */
export interface ObservationRecord {
  id: string; // Opaque server-side identifier (index into server cache)
  collection: string; // e.g. "spherex_qr2"
  obsId: string; // obs_id from SIA response
  dateObs: string; // t_min as ISO date string (may be approximate)
  mjd: number | null; // t_min in MJD
  emMin: number | null; // em_min in meters
  emMax: number | null; // em_max in meters
  bandpassName: string | null; // energy_bandpassname
  fov: number | null; // s_fov in degrees
  ra: number; // s_ra
  dec: number; // s_dec
  instrument: string | null;
  facility: string | null;
  calibLevel: number | null; // calib_level
  description: string | null;
}

/** API search response */
export interface SearchResponse {
  success: true;
  records: ObservationRecord[];
  total: number;
  ra: number;
  dec: number;
  size: number;
  retrievedAt: string;
}

export interface SearchErrorResponse {
  success: false;
  error: string;
  code: "VALIDATION_ERROR" | "UPSTREAM_ERROR" | "NO_COVERAGE" | "TIMEOUT";
}

/** Rendered FITS pixel data for display */
export interface FitsImageData {
  /** Normalized pixel values 0–255, row-major */
  pixels: Uint8ClampedArray | number[];
  width: number;
  height: number;
  /** Stretch method used for display */
  stretch: "asinh" | "log" | "linear";
  /** Lower percentile value before normalization */
  vmin: number;
  /** Upper percentile value before normalization */
  vmax: number;
  /** FITS header key-value pairs relevant for provenance display */
  header: Record<string, string | number | boolean | null>;
  isDemo: boolean;
}

/** API cutout response */
export interface CutoutResponse {
  success: true;
  imageData: FitsImageData;
  observationId: string;
  ra: number;
  dec: number;
  size: number;
  retrievedAt: string;
}

export interface CutoutErrorResponse {
  success: false;
  error: string;
  code: "VALIDATION_ERROR" | "UPSTREAM_ERROR" | "FITS_ERROR" | "NOT_FOUND";
}

export type ApiSearchResponse = SearchResponse | SearchErrorResponse;
export type ApiCutoutResponse = CutoutResponse | CutoutErrorResponse;

export interface FeaturedTarget {
  name: string;
  ra: number;
  dec: number;
  description: string;
  type: string;
}
