"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { type Role, ROLE_OPTIONS } from "@/lib/roles";
import { cn } from "@/lib/utils";

export function RoleSelect({
  value,
  onChange,
  disabled,
  fullWidth,
  noPortal,
}: {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Usar quando o componente está dentro de um Dialog/Sheet — evita conflito de focus trap */
  noPortal?: boolean;
}) {
  const positioner = (
    <Select.Positioner sideOffset={4} align="start">
      <Select.Popup
        className={cn(
          "z-50 overflow-hidden rounded-lg border border-border bg-popover shadow-md outline-none",
          "transition-[opacity,scale] duration-100 ease-in",
          "data-starting-style:opacity-0 data-starting-style:scale-95",
          "data-ending-style:opacity-0 data-ending-style:scale-95",
          fullWidth && "w-[var(--anchor-width)]"
        )}
      >
        <Select.List className="p-1">
          {ROLE_OPTIONS.map((opt) => (
            <Select.Item
              key={opt.value}
              value={opt.value}
              className="flex cursor-default select-none items-center justify-between gap-3 rounded-md px-2.5 py-1.5 text-sm text-popover-foreground outline-none data-highlighted:bg-accent data-highlighted:text-foreground"
            >
              <Select.ItemText>{opt.label}</Select.ItemText>
              <Select.ItemIndicator className="text-foreground">
                <Check className="size-3.5" />
              </Select.ItemIndicator>
            </Select.Item>
          ))}
        </Select.List>
      </Select.Popup>
    </Select.Positioner>
  );

  return (
    <Select.Root value={value} onValueChange={(v) => onChange(v as Role)}>
      <Select.Trigger
        disabled={disabled}
        className={cn(
          "flex items-center justify-between gap-2 rounded-md border border-border bg-background text-foreground outline-none transition-colors",
          "hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          fullWidth ? "h-9 w-full px-3 text-sm" : "h-7 px-2.5 text-xs"
        )}
      >
        <Select.Value />
        <ChevronDown className={cn("shrink-0 text-muted-foreground", fullWidth ? "size-4" : "size-3")} />
      </Select.Trigger>

      {noPortal ? positioner : <Select.Portal>{positioner}</Select.Portal>}
    </Select.Root>
  );
}
