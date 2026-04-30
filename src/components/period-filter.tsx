"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatPeriodLong } from "@/lib/format";
import { cn } from "@/lib/utils";

function capitalize(s: string) {
  return s.replace(/^./, (c) => c.toUpperCase());
}

export function PeriodFilter({
  defaultPeriod,
  periods,
}: {
  defaultPeriod: string;
  periods: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("period") || defaultPeriod;

  const currentIdx = periods.indexOf(current);
  const isDefault = current === defaultPeriod;

  function navigate(idx: number) {
    const period = periods[idx];
    if (!period) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    router.push(`${pathname}?${params.toString()}`);
  }

  function goToDefault() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", defaultPeriod);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      {/* Botão "Mais recente" — aparece só quando não está no período padrão */}
      <button
        type="button"
        onClick={goToDefault}
        className={cn(
          "rounded-md border border-border px-2.5 py-1 text-xs font-medium transition-all duration-150",
          isDefault
            ? "pointer-events-none opacity-0 w-0 px-0 border-0 overflow-hidden"
            : "text-muted-foreground hover:bg-accent hover:text-foreground opacity-100"
        )}
        tabIndex={isDefault ? -1 : 0}
        aria-hidden={isDefault}
      >
        Mais recente
      </button>

      {/* Navegador de setas */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => navigate(currentIdx - 1)}
          disabled={currentIdx <= 0}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-3.5" />
        </button>

        <span className="min-w-[120px] text-center text-sm font-medium tabular-nums">
          {current ? capitalize(formatPeriodLong(current)) : "—"}
        </span>

        <button
          type="button"
          onClick={() => navigate(currentIdx + 1)}
          disabled={currentIdx >= periods.length - 1}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
