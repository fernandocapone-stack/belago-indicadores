import { INDICATORS, previousPeriod, sameMonthPreviousYear, type Category } from "@/lib/indicators";
import {
  derivePeriods,
  getPoints,
  getValueAt,
  loadMeasurements,
} from "@/lib/data-source";
import { KpiCard } from "./kpi-card";
import { TrendChart } from "./trend-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { formatPeriodLong } from "@/lib/format";

export async function CategoryPage({
  category,
  searchParams,
  subtitle,
  description,
}: {
  category: Category;
  searchParams: { period?: string };
  subtitle?: string;
  description?: string;
}) {
  const map = await loadMeasurements();
  const periods = derivePeriods(map);
  const period = searchParams.period || periods[periods.length - 1];
  const prev = previousPeriod(period, periods);
  const yoy = sameMonthPreviousYear(period);
  const indicators = INDICATORS.filter((i) => i.category === category);

  return (
    <div className="space-y-6">
      <div>
        {subtitle && <h2 className="text-base font-medium text-foreground">{subtitle}</h2>}
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {formatPeriodLong(period).replace(/^./, (c) => c.toUpperCase())} · comparações vs{" "}
          {prev ? formatPeriodLong(prev) : "—"} (MoM) e {formatPeriodLong(yoy)} (YoY)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {indicators.map((ind) => (
          <KpiCard
            key={ind.id}
            indicator={ind}
            current={getValueAt(map, ind.id, period)}
            previous={prev ? getValueAt(map, ind.id, prev) : null}
            yoy={getValueAt(map, ind.id, yoy)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {indicators.map((ind) => {
          const data = getPoints(map, ind.id);
          return (
            <Card key={ind.id}>
              <CardHeader>
                <CardTitle className="text-foreground text-base">{ind.label}</CardTitle>
                {ind.description && <CardDescription>{ind.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <TrendChart indicator={ind} data={data} highlightPeriod={period} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
