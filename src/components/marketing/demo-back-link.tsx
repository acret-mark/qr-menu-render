import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// specs/030-marketing-homepage FR-008. A plain <a>-backed link (via
// next/link, which renders a real <a href="/">) — not a button/JS
// handler, so it still works with JavaScript disabled. Positioned fixed
// top-left so it never overlaps the embedded iframe's own UI in either
// /demo variant.
export function DemoBackLink() {
  return (
    <Link
      href="/"
      className="fixed top-4 left-4 z-50 flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-black/85"
    >
      <ArrowLeft size={16} />
      Back to homepage
    </Link>
  );
}
