import { SearchX } from "lucide-react";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import type { SearchResult } from "@/lib/menu/search";

export function SearchResults({
  query,
  results,
  onOpenItem,
}: {
  query: string;
  results: SearchResult[];
  onOpenItem: (itemId: string) => void;
}) {
  if (results.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <div className="flex size-[52px] items-center justify-center rounded-full bg-muted text-muted-foreground">
          <SearchX className="size-6" strokeWidth={2} />
        </div>
        <h2 className="text-lg font-medium">No matches for &ldquo;{query}&rdquo;</h2>
        <p className="max-w-[32ch] text-sm text-muted-foreground">Try a different search term.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4">
      <p className="pb-1 pt-3 text-[0.82rem] text-muted-foreground">
        {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
      </p>
      <ul className="flex flex-col gap-6 pb-6 pt-2">
        {results.map(({ item }) => (
          <MenuItemCard key={item.id} item={item} onOpen={() => onOpenItem(item.id)} />
        ))}
      </ul>
    </div>
  );
}
