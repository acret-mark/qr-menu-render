import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnCategories } from "@/lib/data-access/categories";
import { ItemForm } from "@/components/items/item-form";

// Add item (specs/005-menu-items FR-001, FR-007). Session gate now lives in
// (owner)/layout.tsx (specs/009 FR-012).
export default async function NewItemPage() {
  // (owner)/layout.tsx redirects unauthenticated visitors, but Next.js still
  // evaluates this page concurrently with that redirect — bail out quietly
  // rather than asserting non-null; the eventual response is the layout's
  // redirect regardless.
  const user = await getCurrentUser();
  if (!user) return null;

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
