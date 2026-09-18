import { Skeleton } from "@/components/ui/skeleton";
import { OwnerPageHeaderSkeleton } from "@/components/dashboard/owner-shell-skeleton";

// Matches dashboard/page.tsx's own container — OwnerHeader/StatusBanner/
// OwnerTabBar are rendered by (owner)/layout.tsx outside this route's
// Suspense boundary, so they're already on screen by the time this shows.
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4">
      <OwnerPageHeaderSkeleton />

      <Skeleton className="h-5 w-48" />

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <Skeleton className="mx-auto h-7 w-8" />
          <Skeleton className="mx-auto mt-2 h-3 w-16" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <Skeleton className="mx-auto h-7 w-8" />
          <Skeleton className="mx-auto mt-2 h-3 w-20" />
        </div>
      </div>

      <Skeleton className="h-[52px] w-full rounded-lg" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );
}
