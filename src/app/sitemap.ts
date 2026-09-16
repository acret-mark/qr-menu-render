import type { MetadataRoute } from "next";

// Only the four marketing/legal URLs are ever listed here — this MUST NOT
// enumerate business slugs, regardless of how many businesses exist, since
// per-business menu pages are intentionally excluded from indexing (specs/033
// FR-004).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified },
    { url: `${SITE_URL}/privacy`, lastModified },
    { url: `${SITE_URL}/terms`, lastModified },
    { url: `${SITE_URL}/demo`, lastModified },
  ];
}
