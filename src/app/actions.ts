"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import { loadMeasurements, getValueAt } from "@/lib/data-source";
import { INDICATORS } from "@/lib/indicators";

export type SaveResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export async function saveMedicao(
  indicatorId: string,
  period: string,
  value: number | null
): Promise<SaveResult> {
  if (!SUPABASE_ENABLED) {
    return { ok: false, error: "Supabase não configurado" };
  }
  if (!/^\d{4}-\d{2}$/.test(period)) {
    return { ok: false, error: "Período inválido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada" };

  if (value === null || Number.isNaN(value)) {
    const { error } = await supabase
      .from("medicoes")
      .delete()
      .eq("indicator_id", indicatorId)
      .eq("period", period);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/", "layout");
    return { ok: true, value: 0 };
  }

  const { error } = await supabase
    .from("medicoes")
    .upsert(
      { indicator_id: indicatorId, period, value, updated_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: "indicator_id,period" }
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, value };
}

export async function getMedicoesPorPeriodo(
  period: string
): Promise<Record<string, number | null>> {
  const map = await loadMeasurements();
  return Object.fromEntries(
    INDICATORS.map((ind) => [ind.id, getValueAt(map, ind.id, period)])
  );
}

export async function signOut() {
  if (!SUPABASE_ENABLED) return;
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
