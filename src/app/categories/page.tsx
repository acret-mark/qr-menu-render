import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import { getOwnCategories } from "@/lib/data-access/categories";
import { getOwnItems } from "@/lib/data-access/items";
import { getOwnCategoryTranslations } from "@/lib/data-access/translations";
import { hasStaleTranslation } from "@/lib/categories/translation-status";
import { CategoryList, type CategoryListItem } from "@/components/categories/category-list";
import { AddCategoryFab } from "@/components/categories/add-category-fab";

// Owner category manager (specs/004-category-manager). No shared (owner)
// layout exists yet (research.md Decision 4) — this page checks its own
// session, same as /dashboard and /admin already do.
export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOwnBusiness(user.id);
  if (!business) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <p className="text-sm text-destructive">No business found for this account.</p>
      </div>
    );
  }

  const [categories, items, translations] = await Promise.all([
    getOwnCategories(user.id),
    getOwnItems(user.id),
    getOwnCategoryTranslations(user.id),
  ]);

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
      <CategoryList categories={listItems} />
      <AddCategoryFab />
    </div>
  );
}
