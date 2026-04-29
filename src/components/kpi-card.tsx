"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Indicator } from "@/lib/indicators";
import { formatValue, getStatus, deltaPct, formatDelta, type Status } from "@/lib/format";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<Status, string> = {
  good: "Meta atingida",
  warn: "Atenção",
  bad: "Abaixo da meta",
  neutral: "Sem meta",
};

const STATUS_VARIANT: Record<Status, "success" | "warning" | "destructive" | "muted"> = {
  good: "success",
  warn: "warning",
  bad: "destructive",
  neutral: "muted",
};

const STATUS_DOT: Record<Status, string> = {
  good: "bg-success",
  warn: "bg-warning",
  bad: "bg-destructive",
  neutral: "bg-muted-foreground",
};

export function KpiCard({
  indicator,
  current,
  previous,
  yoy,
  href,
}: {
  indicator: Indicator;
  current: number | null;
  previous: number | null;
  yoy?: number | null;
  href?: string;
}) {
  const status = getStatus(indicator, current);
  const delta = deltaPct(current, previous);
  const formatted = formatDelta(delta, indicator.direction);
  const yoyDelta = yoy != null ? deltaPct(current, yoy) : null;
  const yoyFormatted = formatDelta(yoyDelta, indicator.direction);

  const inner = (
    <Card
      className={cn(
        "p-5 group hover:shadow-sm transition-all",
        href && "hover:border-primary/40 cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("size-2 rounded-full shrink-0", STATUS_DOT[status])} />
          <h3 className="text-xs font-medium text-muted-foreground truncate">{indicator.label}</h3>
        </div>
        {href && (
          <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-semibold tabular-nums">
          {formatValue(current, indicator.kind)}
        </span>
        {indicator.meta != null && (
          <span className="text-[11px] text-muted-foreground">
            meta {formatValue(indicator.meta, indicator.kind)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <Badge variant={STATUS_VARIANT[status]} className="text-[10px]">
          {STATUS_LABEL[status]}
        </Badge>
        <div className="flex flex-col items-end text-[11px]">
          <span
            className={cn(
              "tabular-nums",
              formatted.positive === true && "text-success",
              formatted.positive === false && "text-destructive",
              formatted.positive == null && "text-muted-foreground"
            )}
            title="vs mês anterior"
          >
            MoM {formatted.text}
          </span>
          {yoy != null && (
            <span
              className={cn(
                "tabular-nums",
                yoyFormatted.positive === true && "text-success",
                yoyFormatted.positive === false && "text-destructive",
                yoyFormatted.positive == null && "text-muted-foreground"
              )}
              title="vs mesmo mês ano anterior"
            >
              YoY {yoyFormatted.text}
            </span>
          )}
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
