"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { reorderCategory } from "@/lib/categories/actions";
import { Button } from "@/components/ui/button";

export function ReorderControls({
  categoryId,
  isFirst,
  isLast,
}: {
  categoryId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, setPending] = useState<"up" | "down" | null>(null);

  async function move(direction: "up" | "down") {
    if (pending) return;
    setPending(direction);
    await reorderCategory({ id: categoryId, direction });
    setPending(null);
  }

  return (
    <div className="flex flex-col">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Move up"
        disabled={isFirst || pending !== null}
        onClick={() => move("up")}
      >
        <ChevronUp className={pending === "up" ? "animate-pulse" : undefined} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Move down"
        disabled={isLast || pending !== null}
        onClick={() => move("down")}
      >
        <ChevronDown className={pending === "down" ? "animate-pulse" : undefined} />
      </Button>
    </div>
  );
}
