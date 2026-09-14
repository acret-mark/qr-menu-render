import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import { getOwnCategories } from "@/lib/data-access/categories";
import { getOwnItems } from "@/lib/data-access/items";
import { getOwnItemTranslations } from "@/lib/data-access/translations";
import { hasStaleTranslation } from "@/lib/categories/translation-status";
import { MenuItemList, type MenuItemListCategory } from "@/components/items/menu-item-list";
import { AddItemFab } from "@/components/items/add-item-fab";
import Link from "next/link";

// Owner menu item list (specs/005-menu-items). No shared (owner) layout
// exists yet (research.md Decision 4) — this page checks its own session.
export default async function MenuPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOwnBusiness(user.id);
  if (!business) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold">Menu</h1>
        <p className="text-sm text-destructive">No business found for this account.</p>
      </div>
    );
  }

  const [categories, items, translations] = await Promise.all([
    getOwnCategories(user.id),
    getOwnItems(user.id),
    getOwnItemTranslations(user.id),
  ]);

  if (categories.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold">Menu</h1>
        <p className="text-sm text-muted-foreground">
          No categories yet.{" "}
          <Link href="/categories" className="text-accent underline">
            Create a category
          </Link>{" "}
          to start adding items.
        </p>
      </div>
    );
  }

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const listCategories: MenuItemListCategory[] = sortedCategories.map((category) => {
    const categoryItems = items
      .filter((item) => item.categoryId === category.id)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => {
        const translationsForItem = translations.filter((t) => t.itemId === item.id);
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          isSoldOut: item.isSoldOut,
          isBestSeller: item.isBestSeller,
          hasStaleTranslation: item.description
            ? hasStaleTranslation(item.description, business.sourceLanguage, translationsForItem)
            : false,
        };
      });

    return { id: category.id, name: category.name, items: categoryItems };
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">Menu</h1>
      <MenuItemList categories={listCategories} />
      <AddItemFab />
    </div>
  );
}
