import { Skeleton } from "@/components/ui/skeleton";
import { OwnerPageHeaderSkeleton } from "@/components/dashboard/owner-shell-skeleton";

// Matches dashboard/page.tsx's own container — OwnerHeader/StatusBanner/
// OwnerTabBar are rendered by (owner)/layout.tsx outside this route's
// Suspense boundary, so they're already on screen by the time this shows.
export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
      <OwnerPageHeaderSkeleton />

      <Skeleton className="h-5 w-48" />

      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-[88px] rounded-lg" />
        <Skeleton className="h-[88px] rounded-lg" />
      </div>

      <Skeleton className="h-[60px] w-full rounded-lg" />
      <Skeleton className="h-[52px] w-full rounded-lg" />
    </div>
  );
}
