import type { Metadata } from "next";

// Pass-through layout with no other purpose than carrying the noindex
// directive across the whole admin area — no shared layout currently spans
// both admin/login and admin/(protected)/*, so this one is added one level
// up to cover both without duplicating the directive on every admin page
// (specs/033 FR-008).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
