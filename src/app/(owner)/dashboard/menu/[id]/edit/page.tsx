import { getCurrentUser } from "@/lib/auth/session";
import { getOwnCategories } from "@/lib/data-access/categories";
import { getOwnItemById } from "@/lib/data-access/items";
import { ItemForm } from "@/components/items/item-form";

// Edit item (specs/005-menu-items FR-004). getOwnItemById returning null
// also covers a cross-tenant access attempt (FR-008) — indistinguishable
// from a genuinely missing item, by design. Session gate now lives in
// (owner)/layout.tsx (specs/009 FR-012).
export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  // (owner)/layout.tsx redirects unauthenticated visitors, but Next.js still
  // evaluates this page concurrently with that redirect — bail out quietly
  // rather than asserting non-null; the eventual response is the layout's
  // redirect regardless.
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  const [item, categories] = await Promise.all([
    getOwnItemById(user.id, id),
    getOwnCategories(user.id),
  ]);

  if (!item) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold">Edit item</h1>
        <p className="text-sm text-destructive">That item couldn&apos;t be found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">Edit item</h1>
      <ItemForm categories={categories} item={item} />
    </div>
  );
}
