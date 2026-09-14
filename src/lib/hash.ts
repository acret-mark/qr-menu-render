import { createHash } from "crypto";

/**
 * The content-hash used by every translate-on-save feature (categories now,
 * items/ingredients later) to decide whether a stored translation is still
 * current — matches qr-menu-dev's `source_hash` derivation exactly (sha256
 * of the trimmed source text).
 */
export function sha256Hex(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}
