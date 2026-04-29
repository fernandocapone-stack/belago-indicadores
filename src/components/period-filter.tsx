"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { formatPeriodLong } from "@/lib/format";
import { NativeSelect } from "./ui/select-native";

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

  function setPeriod(p: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", p);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Período</span>
      <NativeSelect value={current} onChange={(e) => setPeriod(e.target.value)}>
        {[...periods].reverse().map((p) => (
          <option key={p} value={p}>
            {formatPeriodLong(p).replace(/^./, (c) => c.toUpperCase())}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
