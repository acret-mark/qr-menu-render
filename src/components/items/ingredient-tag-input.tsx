"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { createIngredientAction } from "@/lib/ingredients/actions";

export type IngredientOption = { id: string; name: string };

const MAX_SUGGESTIONS = 6;

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * specs/023-menu-item-ingredients. Suggest-or-create tag input (FR-001–
 * FR-008): suggestions are filtered client-side over the owner's full
 * ingredient list (research.md Decision 1, no new query per keystroke).
 * `allIngredients` grows in place as new ingredients are created within
 * this same form session, so a second newly-typed ingredient can
 * immediately suggest the first.
 */
export function IngredientTagInput({
  allIngredients,
  onAllIngredientsChange,
  selected,
  onSelectedChange,
}: {
  allIngredients: IngredientOption[];
  onAllIngredientsChange: (next: IngredientOption[]) => void;
  selected: IngredientOption[];
  onSelectedChange: (next: IngredientOption[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const trimmedQuery = query.trim();
  const normalizedQuery = normalize(query);

  const suggestions = useMemo(() => {
    if (!trimmedQuery) return [];
    return allIngredients
      .filter((i) => !selectedIds.has(i.id))
      .filter((i) => normalize(i.name).includes(normalizedQuery))
      .slice(0, MAX_SUGGESTIONS);
  }, [allIngredients, trimmedQuery, normalizedQuery, selectedIds]);

  // FR-005: an exact match (after trim + case-fold) is reused, never
  // offered as a "create new" option alongside it.
  const exactMatch = allIngredients.find((i) => normalize(i.name) === normalizedQuery);
  const showCreateOption = trimmedQuery !== "" && !exactMatch;

  function selectIngredient(ingredient: IngredientOption) {
    if (selectedIds.has(ingredient.id)) {
      setQuery("");
      return; // already attached — a no-op, not a duplicate tag
    }
    onSelectedChange([...selected, ingredient]);
    setQuery("");
    setError(null);
  }

  async function handleCreate() {
    if (!trimmedQuery || isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      const result = await createIngredientAction(trimmedQuery);
      if (!result.ok) {
        setError("Couldn't add that ingredient — try again.");
        return;
      }
      onAllIngredientsChange([...allIngredients, result.ingredient]);
      selectIngredient(result.ingredient);
    } finally {
      setIsCreating(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (exactMatch) {
      selectIngredient(exactMatch);
    } else if (showCreateOption) {
      handleCreate();
    }
  }

  function removeIngredient(id: string) {
    onSelectedChange(selected.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="ingredient-input" className="text-sm font-medium">
        Ingredients
      </label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((ingredient) => (
            <span
              key={ingredient.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
            >
              {ingredient.name}
              <button
                type="button"
                aria-label={`Remove ${ingredient.name}`}
                onClick={() => removeIngredient(ingredient.id)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          id="ingredient-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type to search or add an ingredient…"
          className="h-11 w-full rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />

        {(suggestions.length > 0 || showCreateOption) && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-lg">
            {suggestions.map((ingredient) => (
              <li key={ingredient.id}>
                <button
                  type="button"
                  onClick={() => selectIngredient(ingredient)}
                  className="block w-full px-3.5 py-2 text-left text-sm hover:bg-muted"
                >
                  {ingredient.name}
                </button>
              </li>
            ))}
            {showCreateOption && (
              <li>
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={handleCreate}
                  className="block w-full px-3.5 py-2 text-left text-sm text-accent hover:bg-muted disabled:opacity-50"
                >
                  {isCreating ? "Adding…" : `+ Add "${trimmedQuery}"`}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
