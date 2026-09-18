import { Skeleton } from "@/components/ui/skeleton";
import { OwnerPageHeaderSkeleton } from "@/components/dashboard/owner-shell-skeleton";

// Matches qr/page.tsx's own container plus QrCodeView's actual shape (size-64
// code box, name/url text, PNG + PDF download buttons) — OwnerHeader/
// OwnerTabBar are rendered by (owner)/layout.tsx outside this route's
// Suspense boundary.
export default function QrLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
      <OwnerPageHeaderSkeleton />
      <div className="flex flex-col items-center gap-4 py-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="size-64 rounded-lg" />
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex w-full max-w-xs flex-col gap-2">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
