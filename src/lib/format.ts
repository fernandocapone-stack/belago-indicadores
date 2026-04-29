import type { Indicator, Kind } from "./indicators";

export function formatValue(value: number | null | undefined, kind: Kind): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (kind === "percent") {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (kind === "integer") {
    return value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  }
  if (kind === "time") {
    const total = Math.max(0, Math.round(value));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h${String(m).padStart(2, "0")}min`;
    if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`;
    return `${s}s`;
  }
  return String(value);
}

export function formatPeriod(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

export function formatPeriodLong(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export type Status = "good" | "warn" | "bad" | "neutral";

export function getStatus(indicator: Indicator, value: number | null): Status {
  if (value === null || value === undefined) return "neutral";
  if (indicator.bands) {
    const { good, warn } = indicator.bands;
    if (indicator.direction === "up") {
      if (value >= good) return "good";
      if (value >= warn) return "warn";
      return "bad";
    }
    if (value <= good) return "good";
    if (value <= warn) return "warn";
    return "bad";
  }
  if (indicator.meta != null) {
    const ratio = indicator.direction === "up" ? value / indicator.meta : indicator.meta / value;
    if (ratio >= 1) return "good";
    if (ratio >= 0.85) return "warn";
    return "bad";
  }
  return "neutral";
}

export function deltaPct(current: number | null, prev: number | null): number | null {
  if (current == null || prev == null || prev === 0) return null;
  return (current - prev) / prev;
}

export function formatDelta(delta: number | null, direction: "up" | "down"): {
  text: string;
  positive: boolean | null;
} {
  if (delta == null) return { text: "—", positive: null };
  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "■";
  const isImprovement = direction === "up" ? delta > 0 : delta < 0;
  const isWorse = direction === "up" ? delta < 0 : delta > 0;
  return {
    text: `${arrow} ${(Math.abs(delta) * 100).toFixed(1)}%`,
    positive: isImprovement ? true : isWorse ? false : null,
  };
}
