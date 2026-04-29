export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/dashboard-shell";
import { derivePeriods, loadMeasurements } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";

function buildPeriodOptions(dataPeriods: string[]): string[] {
  const set = new Set(dataPeriods);
  const today = new Date();
  for (let i = -2; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return Array.from(set).sort();
}

async function getUserEmail(): Promise<string | null> {
  if (!SUPABASE_ENABLED) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const map = await loadMeasurements();
  const dataPeriods = derivePeriods(map);
  const periods = buildPeriodOptions(dataPeriods);
  const defaultPeriod = dataPeriods[dataPeriods.length - 1] ?? periods[periods.length - 1];
  const userEmail = await getUserEmail();

  const lastDataPeriod = dataPeriods[dataPeriods.length - 1] ?? "";

  return (
    <DashboardShell
      periods={periods}
      defaultPeriod={defaultPeriod}
      lastDataPeriod={lastDataPeriod}
      userEmail={userEmail}
    >
      {children}
    </DashboardShell>
  );
}
