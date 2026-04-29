import {
  INDICATORS,
  INDICATOR_BY_ID,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  previousPeriod,
  sameMonthPreviousYear,
} from "@/lib/indicators";
import {
  derivePeriods,
  getPoints,
  getValueAt,
  loadMeasurements,
} from "@/lib/data-source";
import { KpiCard } from "@/components/kpi-card";
import { TrendChart } from "@/components/trend-chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPeriodLong } from "@/lib/format";

const CATEGORY_HREF: Record<string, string> = {
  atendimento: "/atendimento",
  tickets: "/tickets",
  niveis: "/niveis",
  aging: "/aging",
};

const HIGHLIGHT_IDS = [
  "tma",
  "tme",
  "taxa_abandono",
  "disponibilidade_central",
  "volume_tickets",
  "pct_tickets_sla",
  "pct_encerrados_n1",
  "pct_aging_1d",
];

const TREND_HIGHLIGHTS = ["volume_tickets", "tma", "pct_tickets_sla", "pct_aging_1d"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const map = await loadMeasurements();
  const periods = derivePeriods(map);
  const period = sp.period || periods[periods.length - 1];
  const prev = previousPeriod(period, periods);
  const yoy = sameMonthPreviousYear(period);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">Indicadores operacionais consolidados.</p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatPeriodLong(period).replace(/^./, (c) => c.toUpperCase())} · comparado a{" "}
          {prev ? formatPeriodLong(prev) : "—"} (mês anterior) e{" "}
          {formatPeriodLong(yoy)} (ano anterior)
        </p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Destaques do mês</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {HIGHLIGHT_IDS.map((id) => {
            const ind = INDICATOR_BY_ID[id];
            if (!ind) return null;
            return (
              <KpiCard
                key={id}
                indicator={ind}
                current={getValueAt(map, id, period)}
                previous={prev ? getValueAt(map, id, prev) : null}
                yoy={getValueAt(map, id, yoy)}
                href={CATEGORY_HREF[ind.category]}
              />
            );
          })}
        </div>
      </section>

      <Separator />

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Tendências principais</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {TREND_HIGHLIGHTS.map((id) => {
            const ind = INDICATOR_BY_ID[id];
            if (!ind) return null;
            const data = getPoints(map, id);
            return (
              <Card key={id}>
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
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Por categoria</h2>
        {CATEGORY_ORDER.map((cat) => {
          const inds = INDICATORS.filter((i) => i.category === cat);
          return (
            <Card key={cat}>
              <CardHeader>
                <CardTitle className="text-foreground text-base">{CATEGORY_LABELS[cat]}</CardTitle>
                <CardDescription>{inds.length} indicadores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {inds.map((ind) => (
                    <KpiCard
                      key={ind.id}
                      indicator={ind}
                      current={getValueAt(map, ind.id, period)}
                      previous={prev ? getValueAt(map, ind.id, prev) : null}
                      yoy={getValueAt(map, ind.id, yoy)}
                      href={CATEGORY_HREF[cat]}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
