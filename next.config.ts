import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Carried over from qr-menu-dev as the starting value. There, 4mb was
      // capped specifically to stay under Vercel's serverless 4.5MB hard
      // body-size ceiling (specs/001-render-hosting-cutover FR-005) — Render's
      // Web Service is a persistent Node process, not a serverless function,
      // so that ceiling doesn't apply here. Left at 4mb deliberately for now
      // (not required to change per that spec's T029) rather than raised
      // speculatively; revisit if a real upload-size need shows up.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
