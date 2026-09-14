import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnCategories } from "@/lib/data-access/categories";
import { ItemForm } from "@/components/items/item-form";

// Add item (specs/005-menu-items FR-001, FR-007). No shared (owner) layout
// exists yet (research.md Decision 4) — this page checks its own session.
export default async function NewItemPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const categories = await getOwnCategories(user.id);

  if (categories.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold">Add item</h1>
        <p className="text-sm text-muted-foreground">
          No categories yet.{" "}
          <Link href="/categories" className="text-accent underline">
            Create a category
          </Link>{" "}
          before adding items.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">Add item</h1>
      <ItemForm categories={categories} />
    </div>
  );
}
