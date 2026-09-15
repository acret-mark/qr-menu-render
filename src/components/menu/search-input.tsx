"use client";

import { Search } from "lucide-react";

export function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-3.5 py-2.5 text-sm">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search the menu…"
        className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
