import { MenuNotAvailable } from "@/components/menu/menu-not-available";

// Any extra path segments under /menu/{slug}/... route here instead of a
// framework 404 (spec Edge Cases — malformed URLs) — matches qr-menu-dev's
// own catch-all route for this exact case.
export default function MenuCatchAllPage() {
  return <MenuNotAvailable />;
}
