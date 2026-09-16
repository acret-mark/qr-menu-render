import type { ImageLoaderProps } from "next/image";

const UPLOAD_MARKER = "/upload/";

/**
 * next/image `loader` for Cloudinary-delivered menu photos (specs/034-
 * performance-optimization-pass): inserts an f_auto,q_auto,w_{width}
 * transform so the CDN picks the smallest modern format the requesting
 * browser supports at the size actually rendered. Any src that isn't a
 * Cloudinary upload URL passes through unchanged.
 */
export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  const uploadIndex = src.indexOf(UPLOAD_MARKER);
  if (!src.includes("res.cloudinary.com") || uploadIndex === -1) {
    return src;
  }

  const insertAt = uploadIndex + UPLOAD_MARKER.length;
  const transform = `f_auto,q_${quality ?? "auto"},w_${width}`;

  return `${src.slice(0, insertAt)}${transform}/${src.slice(insertAt)}`;
}
