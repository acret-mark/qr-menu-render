import Link from "next/link";
import { Plus } from "lucide-react";

export function AddItemFab() {
  return (
    <Link
      href="/dashboard/menu/new"
      aria-label="Add item"
      className="fixed right-[max(1rem,calc((100vw-48rem)/2+1rem))] bottom-20 z-10 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
    >
      <Plus size={24} />
    </Link>
  );
}
