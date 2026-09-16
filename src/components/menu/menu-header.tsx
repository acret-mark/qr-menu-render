"use client";

import Image from "next/image";
import { cloudinaryLoader } from "@/lib/images/cloudinary";

// Deliberate QR-motif placeholder pattern when no logo is set — matches
// qr-menu-dev's own choice of a themed background over a generic gray box
// or avatar-initial fallback (research.md).
//
// specs/034-performance-optimization-pass: "use client" added here — not in
// qr-menu-dev's own plan.md/data-model.md, which didn't anticipate this —
// because next/image's `loader` prop can only be passed from a Client
// Component (confirmed directly against Next's own bundled docs,
// node_modules/next/dist/docs/.../image.md: "Customizing the image loader
// file... requires using Client Components to serialize the provided
// function"). Passing `loader={cloudinaryLoader}` from this file as a
// Server Component threw "Functions cannot be passed directly to Client
// Components" at runtime — caught during this feature's own manual
// verification pass, not by tsc/lint. qr-menu-dev never hit this because
// its equivalent header lives inside menu-home.tsx, already a Client
// Component top-to-bottom; qr-menu-render's MenuHeader is architecturally
// separate (Clarifications). This component has no interactive logic of
// its own, so the added client-JS cost is minimal — confirmed via this
// feature's own before/after bundle measurement (tasks.md T008).
const HERO_PATTERN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='none'/%3E%3Cpath d='M0 0h20v20H0zM40 0h20v20H40zM0 40h20v20H0zM40 40h20v20H40z' fill='%23ffffff' fill-opacity='0.08'/%3E%3C/svg%3E";

export function MenuHeader({
  name,
  logoUrl,
  languageSelector,
}: {
  name: string;
  logoUrl: string | null;
  languageSelector?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div
        className="relative flex h-40 items-center justify-center overflow-hidden bg-primary"
        style={!logoUrl ? { backgroundImage: `url("${HERO_PATTERN}")` } : undefined}
      >
        {logoUrl && (
          <>
            <Image
              loader={cloudinaryLoader}
              src={logoUrl}
              alt=""
              fill
              sizes="(min-width: 448px) 448px, 100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/20" />
          </>
        )}
        {languageSelector && <div className="absolute right-3 top-3">{languageSelector}</div>}
      </div>
      <div className="-mt-6 rounded-t-[28px] bg-card px-4 pb-2 pt-6">
        <h1 className="text-center text-xl font-semibold">{name}</h1>
      </div>
    </div>
  );
}
