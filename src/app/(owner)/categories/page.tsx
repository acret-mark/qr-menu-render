import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import { getOwnCategories } from "@/lib/data-access/categories";
import { getOwnItems } from "@/lib/data-access/items";
import { getOwnCategoryTranslations } from "@/lib/data-access/translations";
import { hasStaleTranslation } from "@/lib/categories/translation-status";
import { getSubscriptionAccess } from "@/lib/subscriptions/access-gate";
import { CategoryList, type CategoryListItem } from "@/components/categories/category-list";
import { AddCategoryFab } from "@/components/categories/add-category-fab";

// Owner category manager (specs/004-category-manager). Session gate now
// lives in (owner)/layout.tsx (specs/009 FR-012) — this page's own
// business-existence handling below is unchanged (research.md Decision 3).
export default async function CategoriesPage() {
  // (owner)/layout.tsx redirects unauthenticated visitors, but Next.js still
  // evaluates this page concurrently with that redirect — bail out quietly
  // rather than asserting non-null; the eventual response is the layout's
  // redirect regardless.
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await getOwnBusiness(user.id);
  if (!business) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-destructive">No business found for this account.</p>
      </div>
    );
  }

  const [categories, items, translations, access] = await Promise.all([
    getOwnCategories(user.id),
    getOwnItems(user.id),
    getOwnCategoryTranslations(user.id),
    getSubscriptionAccess(business.id),
  ]);
  const locked = !access.full;

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const listItems: CategoryListItem[] = sorted.map((category) => {
    const itemCount = items.filter((item) => item.categoryId === category.id).length;
    const translationsForCategory = translations.filter(
      (translation) => translation.categoryId === category.id
    );
    return {
      id: category.id,
      name: category.name,
      itemCount,
      hasStaleTranslation: hasStaleTranslation(
        category.name,
        business.sourceLanguage,
        translationsForCategory
      ),
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <CategoryList categories={listItems} locked={locked} />
      {!locked && <AddCategoryFab />}
    </div>
  );
}
