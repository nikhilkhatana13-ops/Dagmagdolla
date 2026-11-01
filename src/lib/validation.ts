// Input validation for coordinate and cutout parameters

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Allowed cutout size range in degrees */
export const CUTOUT_SIZE_MIN = 0.01;
export const CUTOUT_SIZE_MAX = 0.5;
export const CUTOUT_SIZE_DEFAULT = 0.05;

/** Maximum records to return from IRSA per search */
export const MAX_RECORDS = 20;

export function validateRA(raw: string | null | undefined): ValidationResult {
  if (raw == null || raw === "") {
    return { valid: false, error: "RA is required." };
  }
  const val = parseFloat(raw);
  if (!isFinite(val)) {
    return { valid: false, error: "RA must be a finite decimal number." };
  }
  if (val < 0 || val > 360) {
    return { valid: false, error: "RA must be between 0 and 360 degrees." };
  }
  return { valid: true };
}

export function validateDec(raw: string | null | undefined): ValidationResult {
  if (raw == null || raw === "") {
    return { valid: false, error: "Dec is required." };
  }
  const val = parseFloat(raw);
  if (!isFinite(val)) {
    return { valid: false, error: "Dec must be a finite decimal number." };
  }
  if (val < -90 || val > 90) {
    return { valid: false, error: "Dec must be between -90 and 90 degrees." };
  }
  return { valid: true };
}

export function validateSize(raw: string | null | undefined): ValidationResult {
  if (raw == null || raw === "") {
    return { valid: true }; // use default
  }
  const val = parseFloat(raw);
  if (!isFinite(val) || val <= 0) {
    return {
      valid: false,
      error: "Size must be a positive decimal number of degrees.",
    };
  }
  if (val < CUTOUT_SIZE_MIN || val > CUTOUT_SIZE_MAX) {
    return {
      valid: false,
      error: `Size must be between ${CUTOUT_SIZE_MIN} and ${CUTOUT_SIZE_MAX} degrees.`,
    };
  }
  return { valid: true };
}

export function parseCoordinateInput(
  input: string
): { ra: number; dec: number } | null {
  // Accept "RA, Dec" or "RA Dec" formats
  const trimmed = input.trim().replace(/,/, " ");
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return null;
  const ra = parseFloat(parts[0]);
  const dec = parseFloat(parts[1]);
  if (!isFinite(ra) || !isFinite(dec)) return null;
  if (ra < 0 || ra > 360 || dec < -90 || dec > 90) return null;
  return { ra, dec };
}
