"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import type { Indicator } from "@/lib/indicators";
import { formatValue, formatPeriod } from "@/lib/format";

type Point = { period: string; value: number };

export function TrendChart({
  indicator,
  data,
  highlightPeriod,
  height = 240,
  compareYoy = true,
}: {
  indicator: Indicator;
  data: Point[];
  highlightPeriod?: string;
  height?: number;
  compareYoy?: boolean;
}) {
  const meta = indicator.meta ?? null;

  const valueByPeriod = new Map(data.map((d) => [d.period, d.value]));
  const enriched = data.map((d) => {
    const [y, m] = d.period.split("-").map(Number);
    const prevYearKey = `${y - 1}-${String(m).padStart(2, "0")}`;
    return { ...d, valueYoy: valueByPeriod.get(prevYearKey) ?? null };
  });
  const hasYoy = compareYoy && enriched.some((d) => d.valueYoy != null);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={enriched} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tickFormatter={(p) => formatPeriod(p)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatValue(Number(v), indicator.kind)}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(p) => formatPeriod(String(p))}
            formatter={(v, name) => {
              if (v == null) return ["—", name];
              return [formatValue(Number(v), indicator.kind), name];
            }}
          />
          {hasYoy && (
            <Legend
              verticalAlign="top"
              height={24}
              iconType="plainline"
              wrapperStyle={{ fontSize: 11, paddingBottom: 4 }}
            />
          )}
          {meta != null && (
            <ReferenceLine
              y={meta}
              stroke="var(--success)"
              strokeDasharray="4 4"
              label={{
                value: `Meta ${formatValue(meta, indicator.kind)}`,
                fontSize: 10,
                fill: "var(--success)",
                position: "right",
              }}
            />
          )}
          {highlightPeriod && (
            <ReferenceLine
              x={highlightPeriod}
              stroke="var(--primary)"
              strokeDasharray="2 2"
              opacity={0.5}
            />
          )}
          {hasYoy && (
            <Line
              type="monotone"
              dataKey="valueYoy"
              name="Ano anterior"
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            name={indicator.label}
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--chart-1)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
