import { formatPeso } from "@/lib/admin/format";

// specs/018-business-detail FR-002/FR-003/FR-009. Read-only — no add/
// edit/delete/reorder control anywhere. Shows every item as stored
// (including hidden/sold-out, research.md Decision 2) — the categories/
// items passed in are already unfiltered (adminGetCategoriesForBusiness/
// adminGetItemsForBusiness).
export function BusinessMenuPanel({
  categories,
  items,
}: {
  categories: { id: string; name: string }[];
  items: { id: string; name: string; categoryId: string; price: string; isDisplayed: boolean; isSoldOut: boolean }[];
}) {
  if (categories.length === 0 && items.length === 0) {
    return (
      <p className="px-6 py-10 text-center text-sm text-muted-foreground">
        No menu content yet.
      </p>
    );
  }

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="px-5 py-3 font-medium">Item</th>
          <th className="px-5 py-3 font-medium">Category</th>
          <th className="px-5 py-3 font-medium">Price</th>
          <th className="px-5 py-3 font-medium">Visibility</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className="border-b border-border last:border-none">
            <td className="px-5 py-3.5">{item.name}</td>
            <td className="px-5 py-3.5">{categoryNameById.get(item.categoryId) ?? "—"}</td>
            <td className="px-5 py-3.5">{formatPeso(item.price)}</td>
            <td className="px-5 py-3.5 text-muted-foreground">
              {item.isSoldOut ? "Sold out" : !item.isDisplayed ? "Hidden" : "Visible"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
