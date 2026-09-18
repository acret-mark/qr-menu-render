"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import { cloudinaryLoader } from "@/lib/images/cloudinary";

// Scattered-block pattern echoing a QR code's own pixel mosaic — copied
// verbatim from qr-menu-dev's menu-home.tsx HERO_PATTERN_URL constant
// (specs/026-menu-home-rebrand, ported here per the render visual-parity
// pass). Only white/transparent shapes are baked into the SVG string — the
// actual orange still comes from `bg-primary` below, so no brand hex is
// duplicated outside tokens.css. This is the no-logo fallback only; a
// business with a logo uploaded shows that instead (see below).
//
// specs/034-performance-optimization-pass: "use client" stays on this file
// (not qr-menu-dev's equivalent, which lives inside a Client Component
// top-to-bottom already) — next/image's `loader` prop can only be passed
// from a Client Component (node_modules/next/dist/docs/.../image.md).
// qr-menu-render's MenuHeader is architecturally separate from the
// category/search/item-list tree for that reason (see page.tsx and this
// file's own history); this rebrand pass only restyles it, it doesn't
// collapse that split back together.
const HERO_PATTERN =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2780%27%20height%3D%2780%27%3E%3Crect%20x%3D%274%27%20y%3D%274%27%20width%3D%2710%27%20height%3D%2710%27%20fill%3D%27white%27%20opacity%3D%270.1%27/%3E%3Crect%20x%3D%2720%27%20y%3D%272%27%20width%3D%2714%27%20height%3D%2714%27%20fill%3D%27white%27%20opacity%3D%270.08%27/%3E%3Crect%20x%3D%2740%27%20y%3D%2710%27%20width%3D%278%27%20height%3D%278%27%20fill%3D%27white%27%20opacity%3D%270.12%27/%3E%3Crect%20x%3D%2758%27%20y%3D%274%27%20width%3D%2712%27%20height%3D%2712%27%20fill%3D%27white%27%20opacity%3D%270.07%27/%3E%3Crect%20x%3D%2710%27%20y%3D%2724%27%20width%3D%2716%27%20height%3D%2716%27%20fill%3D%27white%27%20opacity%3D%270.09%27/%3E%3Crect%20x%3D%2734%27%20y%3D%2728%27%20width%3D%2710%27%20height%3D%2710%27%20fill%3D%27white%27%20opacity%3D%270.11%27/%3E%3Crect%20x%3D%2754%27%20y%3D%2726%27%20width%3D%2714%27%20height%3D%2714%27%20fill%3D%27white%27%20opacity%3D%270.08%27/%3E%3Crect%20x%3D%272%27%20y%3D%2744%27%20width%3D%2712%27%20height%3D%2712%27%20fill%3D%27white%27%20opacity%3D%270.1%27/%3E%3Crect%20x%3D%2724%27%20y%3D%2746%27%20width%3D%278%27%20height%3D%278%27%20fill%3D%27white%27%20opacity%3D%270.09%27/%3E%3Crect%20x%3D%2744%27%20y%3D%2742%27%20width%3D%2716%27%20height%3D%2716%27%20fill%3D%27white%27%20opacity%3D%270.07%27/%3E%3Crect%20x%3D%2764%27%20y%3D%2748%27%20width%3D%2710%27%20height%3D%2710%27%20fill%3D%27white%27%20opacity%3D%270.11%27/%3E%3Crect%20x%3D%2714%27%20y%3D%2762%27%20width%3D%2714%27%20height%3D%2714%27%20fill%3D%27white%27%20opacity%3D%270.08%27/%3E%3Crect%20x%3D%2736%27%20y%3D%2764%27%20width%3D%2710%27%20height%3D%2710%27%20fill%3D%27white%27%20opacity%3D%270.1%27/%3E%3Crect%20x%3D%2756%27%20y%3D%2766%27%20width%3D%2712%27%20height%3D%2712%27%20fill%3D%27white%27%20opacity%3D%270.09%27/%3E%3C/svg%3E";

export function MenuHeader({
  name,
  address,
  logoUrl,
  languageSelector,
}: {
  name: string;
  address?: string | null;
  logoUrl: string | null;
  languageSelector?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      {/* No `overflow-hidden` here — the language-selector dropdown below is
          a descendant of this div, and an ancestor's overflow:hidden would
          clip it wherever the dropdown list extends past the hero's own
          bounds (matches qr-menu-dev's menu-home.tsx reasoning verbatim). */}
      <div className="relative shrink-0 bg-primary px-4 pt-6 pb-14">
        {logoUrl ? (
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
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `url("${HERO_PATTERN}")`, backgroundSize: "80px 80px" }}
          />
        )}
        {languageSelector && (
          <div className="relative z-10 flex justify-end">{languageSelector}</div>
        )}
      </div>

      {/* `relative` here is load-bearing, not decorative: the hero above is
          `position: relative` (for its absolutely-positioned logo/pattern
          layer), which makes it a positioned element — CSS's painting-order
          rules put a positioned element above a plain static sibling
          regardless of DOM order, so without this, the hero's sharp-cornered
          background silently paints over this panel's rounded top corners in
          their overlap zone, hiding the rounding entirely. */}
      <div className="relative -mt-6 shrink-0 rounded-t-[28px] bg-card px-4 pt-8">
        <h1 className="text-center font-heading text-[1.4rem] leading-tight">{name}</h1>
        {address && (
          <p className="mt-1 flex items-center justify-center gap-1 text-center text-[0.82rem] leading-tight text-muted-foreground">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{address}</span>
          </p>
        )}
      </div>
    </div>
  );
}
