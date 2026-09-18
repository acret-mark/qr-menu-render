import { Skeleton } from "@/components/ui/skeleton";
import {
  OwnerListSkeleton,
  OwnerPageHeaderSkeleton,
} from "@/components/dashboard/owner-shell-skeleton";

// Matches dashboard/menu/page.tsx's own container — OwnerHeader/OwnerTabBar
// are rendered by (owner)/layout.tsx outside this route's Suspense boundary.
export default function MenuLoading() {
  return (
    <div className="flex flex-col gap-4">
      <OwnerPageHeaderSkeleton />

      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>

      <OwnerListSkeleton rows={6} />
    </div>
  );
}
