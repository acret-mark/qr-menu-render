import {
  OwnerListSkeleton,
  OwnerPageHeaderSkeleton,
} from "@/components/dashboard/owner-shell-skeleton";

// Matches categories/page.tsx's own container — OwnerHeader/OwnerTabBar are
// rendered by (owner)/layout.tsx outside this route's Suspense boundary.
export default function CategoriesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
      <OwnerPageHeaderSkeleton />
      <OwnerListSkeleton rows={5} />
    </div>
  );
}
