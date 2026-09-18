"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

export function Switch({
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      className={cn(
        "relative flex h-6 w-10 shrink-0 items-center rounded-full border border-transparent bg-muted transition-colors",
        "data-[checked]:bg-primary"
      )}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "block size-4.5 translate-x-0.5 rounded-full bg-card shadow transition-transform",
          "data-[checked]:translate-x-[1.25rem]"
        )}
      />
    </SwitchPrimitive.Root>
  );
}
