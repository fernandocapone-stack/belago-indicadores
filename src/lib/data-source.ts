import "server-only";
import staticData from "./data/measurements.json";
import { createClient } from "./supabase/server";
import { SUPABASE_ENABLED } from "./supabase/config";

export type MeasurementsMap = Record<string, Record<string, number>>;

const STATIC_MEASUREMENTS = (staticData as { measurements: MeasurementsMap }).measurements;

export async function loadMeasurements(): Promise<MeasurementsMap> {
  if (!SUPABASE_ENABLED) {
    return STATIC_MEASUREMENTS;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("medicoes")
      .select("indicator_id, period, value");

    if (error) {
      console.error("[data-source] Supabase error, falling back to JSON:", error.message);
      return STATIC_MEASUREMENTS;
    }

    const map: MeasurementsMap = {};
    for (const row of data ?? []) {
      const inner = (map[row.indicator_id] ??= {});
      inner[row.period] = Number(row.value);
    }
    if (Object.keys(map).length === 0) {
      return STATIC_MEASUREMENTS;
    }
    return map;
  } catch (e) {
    console.error("[data-source] failed:", e);
    return STATIC_MEASUREMENTS;
  }
}

export function derivePeriods(map: MeasurementsMap): string[] {
  const set = new Set<string>();
  for (const inner of Object.values(map)) {
    for (const p of Object.keys(inner)) set.add(p);
  }
  return Array.from(set).sort();
}

export function getPoints(
  map: MeasurementsMap,
  indicatorId: string
): { period: string; value: number }[] {
  const inner = map[indicatorId] || {};
  return Object.entries(inner)
    .map(([period, value]) => ({ period, value }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

export function getValueAt(
  map: MeasurementsMap,
  indicatorId: string,
  period: string
): number | null {
  const v = map[indicatorId]?.[period];
  return v === undefined ? null : v;
}
