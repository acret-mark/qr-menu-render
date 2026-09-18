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
    <div className="mt-6 flex items-center gap-2 rounded-full bg-muted px-3.5 py-3.5 text-[0.9rem]">
      <Search className="size-4 shrink-0 opacity-70" />
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
