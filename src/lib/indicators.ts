import data from "./data/measurements.json";

export type Kind = "time" | "percent" | "integer";
export type Direction = "up" | "down";
export type Category = "atendimento" | "tickets" | "niveis" | "aging";

export type Indicator = {
  id: string;
  label: string;
  kind: Kind;
  category: Category;
  direction: Direction;
  meta?: number | null;
  bands?: { good: number; warn: number };
  description?: string;
};

export type Measurement = {
  period: string;
  value: number;
};

const RAW = data as {
  generated_at: string;
  source: string;
  catalog: { id: string; label: string; kind: Kind; category: Category }[];
  metas: Record<string, number>;
  measurements: Record<string, Record<string, number>>;
  pbi: { period: string; registrados: number; total_sla: number; atendidos_2d: number; pct_atendidos_2d: number }[];
};

const META_OVERRIDES: Record<string, Partial<Indicator>> = {
  tma: { direction: "down", description: "Tempo médio que o atendente leva por chamada (segundos)." },
  tme: { direction: "down", description: "Tempo médio que o cliente espera antes de ser atendido (segundos)." },
  disponibilidade_central: { direction: "up", description: "Disponibilidade da central de serviços (%)." },
  volume_chamadas: { direction: "up", description: "Volume de chamadas telefônicas atendidas no mês." },
  taxa_abandono: { direction: "down", description: "% de chamadas abandonadas antes do atendimento.", bands: { good: 0.02, warn: 0.05 } },
  volume_tickets: { direction: "up", description: "Total de tickets abertos no período." },
  volume_tickets_resolvidos: { direction: "up", description: "Total de tickets resolvidos no período." },
  pct_tickets_sla: { direction: "up", description: "% de tickets encerrados dentro do prazo." },
  encerrados_n1: { direction: "up", description: "Tickets resolvidos pelo Nível 1 de atendimento." },
  encerrados_n2: { direction: "up", description: "Tickets resolvidos pelo Nível 2." },
  encerrados_n3: { direction: "up", description: "Tickets escalados ao Nível 3." },
  encerrados_area_negocio: { direction: "down", description: "Tickets encerrados pela área de negócio (idealmente baixo)." },
  pct_encerrados_n1: { direction: "up", description: "% encerrados em N1 (FCR — quanto maior, melhor)." },
  pct_encerrados_n2: { direction: "up", description: "% encerrados em N2." },
  pct_encerrados_n3: { direction: "down", description: "% encerrados em N3 (escalado — idealmente baixo)." },
  pct_encerrados_area_negocio: { direction: "down", description: "% encerrados pela área de negócio (idealmente baixo)." },
  aging_1d: { direction: "up", description: "Quantidade de tickets resolvidos em até 1 dia." },
  aging_2d: { direction: "down", description: "Tickets resolvidos em 2 dias." },
  aging_3d: { direction: "down", description: "Tickets resolvidos em 3 dias." },
  aging_4d: { direction: "down", description: "Tickets resolvidos em 4 dias." },
  aging_5d: { direction: "down", description: "Tickets resolvidos em 5 dias." },
  aging_mais_5d: { direction: "down", description: "Tickets que levaram mais de 5 dias." },
  pct_aging_1d: { direction: "up", description: "% de tickets resolvidos em até 1 dia." },
  pct_aging_2d: { direction: "down" },
  pct_aging_3d: { direction: "down" },
  pct_aging_4d: { direction: "down" },
  pct_aging_5d: { direction: "down" },
  pct_aging_mais_5d: { direction: "down", description: "% que levaram mais de 5 dias (idealmente baixo)." },
};

export const INDICATORS: Indicator[] = RAW.catalog.map((c) => {
  const ov = META_OVERRIDES[c.id] || {};
  return {
    id: c.id,
    label: c.label,
    kind: c.kind,
    category: c.category,
    direction: ov.direction ?? "up",
    meta: RAW.metas[c.id] ?? null,
    bands: ov.bands,
    description: ov.description,
  };
});

export const INDICATOR_BY_ID: Record<string, Indicator> = Object.fromEntries(
  INDICATORS.map((i) => [i.id, i])
);

export function previousPeriod(period: string, periods: string[]): string | null {
  const idx = periods.indexOf(period);
  return idx > 0 ? periods[idx - 1] : null;
}

export function sameMonthPreviousYear(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return `${y - 1}-${String(m).padStart(2, "0")}`;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  atendimento: "Atendimento Telefônico",
  tickets: "Tickets",
  niveis: "Resolução por Nível",
  aging: "Aging de Resolução",
};

export const CATEGORY_ORDER: Category[] = ["atendimento", "tickets", "niveis", "aging"];
