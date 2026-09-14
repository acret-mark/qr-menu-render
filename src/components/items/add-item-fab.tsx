import Link from "next/link";
import { Plus } from "lucide-react";

export function AddItemFab() {
  return (
    <Link
      href="/menu/new"
      aria-label="Add item"
      className="fixed bottom-6 right-6 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
    >
      <Plus />
    </Link>
  );
}
