import { Skeleton } from "@/components/ui/skeleton";

// Shared skeleton pieces for the owner section's loading.tsx files
// (specs/009-owner-dashboard-shell), matching qr-menu-dev's
// owner-shell-skeleton.tsx. OwnerHeader/OwnerTabBar themselves are rendered
// by (owner)/layout.tsx outside any per-page Suspense boundary, so they're
// already on screen by the time a route's loading.tsx shows — these pieces
// only need to stand in for each page's own content.
export function OwnerPageHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className="h-7 w-40" />
    </div>
  );
}

export function OwnerListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
          <Skeleton className="size-9 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
