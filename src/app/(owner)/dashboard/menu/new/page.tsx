import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import { getOwnCategories } from "@/lib/data-access/categories";
import { getOwnIngredients } from "@/lib/data-access/ingredients";
import { getSubscriptionAccess } from "@/lib/subscriptions/access-gate";
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

  const business = await getOwnBusiness(user.id);
  if (business) {
    const access = await getSubscriptionAccess(business.id);
    if (!access.full) {
      // specs/020-unified-subscription-lifecycle FR-012: adding an item is
      // a menu-editing action — blocked while locked, including a direct
      // navigation to this URL (the underlying saveItem action rejects it
      // server-side either way).
      return (
        <div className="flex flex-col gap-4">
          <h1 className="font-heading text-xl font-semibold">Add item</h1>
          <p className="text-sm text-muted-foreground">
            Your subscription has expired. Renew from the{" "}
            <Link href="/business-profile#subscription" className="text-accent underline">
              Subscription tab
            </Link>{" "}
            to add items again.
          </p>
        </div>
      );
    }
  }

  const [categories, allIngredients] = await Promise.all([
    getOwnCategories(user.id),
    getOwnIngredients(user.id),
  ]);

  if (categories.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-xl font-semibold">Add item</h1>
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
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-xl font-semibold">Add item</h1>
      <ItemForm categories={categories} allIngredients={allIngredients} />
    </div>
  );
}
