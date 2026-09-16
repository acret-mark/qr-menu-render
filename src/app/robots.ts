import type { MetadataRoute } from "next";

// Only the public marketing/legal pages are worth indexing — potential
// restaurant-owner customers search for those. Every other route (per-business
// menu pages, the owner dashboard, the admin panel, all auth/account pages,
// and the API) is reached by direct link or QR scan, never by search, and
// indexing it risks thin/duplicate-content problems at scale (specs/033).
//
// This project's disallow list omits qr-menu-dev's own "/auth" entry
// (research.md Decision 2) — qr-menu-render's Auth.js flow has no such
// callback route; /confirm-email (specs/011) is this project's equivalent
// email-confirmation entry point instead, and Auth.js's own routes live
// under /api (already covered by the "/api" disallow entry).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/privacy", "/terms", "/demo"],
      disallow: [
        "/menu",
        "/dashboard",
        "/categories",
        "/qr",
        "/business-profile",
        "/support",
        "/admin",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/confirm-email",
        "/account-suspended",
        "/error",
        "/api",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
