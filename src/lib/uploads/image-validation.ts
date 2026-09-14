// Ported from qr-menu-dev/src/lib/business/logo-validation.ts, generalized
// naming (specs/005-menu-items research.md Decision 3) — same constants and
// logic, just not business-logo-specific, since this project has no
// logo-upload feature yet to justify that name.
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
// Capped at 4MB to leave headroom for multipart overhead under
// next.config.ts's 4mb server-action body-size limit.
export const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

/**
 * Shared by both the client-side check (item-photo-uploader.tsx) and the
 * server action's defense-in-depth check (items/actions.ts) — one source of
 * truth so the two can't silently drift apart.
 */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please upload a JPEG, PNG, or WebP image.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "That image is too large — please use one under 4MB.";
  }

  return null;
}
