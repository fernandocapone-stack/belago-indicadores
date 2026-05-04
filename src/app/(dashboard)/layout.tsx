export const dynamic = "force-dynamic";

import { DashboardShell } from "@/components/dashboard-shell";
import { derivePeriods, loadMeasurements } from "@/lib/data-source";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import { type Role, getRoleFromMetadata } from "@/lib/roles";

function buildPeriodOptions(dataPeriods: string[]): string[] {
  const set = new Set(dataPeriods);
  const today = new Date();
  for (let i = -2; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    set.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return Array.from(set).sort();
}

async function getUserInfo(): Promise<{ email: string | null; role: Role }> {
  if (!SUPABASE_ENABLED) return { email: null, role: "admin" };
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email ?? null;
    const role = getRoleFromMetadata(data.user?.app_metadata as Record<string, unknown> | null);
    return { email, role };
  } catch {
    return { email: null, role: "admin" };
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const map = await loadMeasurements();
  const dataPeriods = derivePeriods(map);
  const periods = buildPeriodOptions(dataPeriods);
  const defaultPeriod = dataPeriods[dataPeriods.length - 1] ?? periods[periods.length - 1];
  const { email: userEmail, role: userRole } = await getUserInfo();

  const lastDataPeriod = dataPeriods[dataPeriods.length - 1] ?? "";

  return (
    <DashboardShell
      periods={periods}
      defaultPeriod={defaultPeriod}
      lastDataPeriod={lastDataPeriod}
      userEmail={userEmail}
      userRole={userRole}
    >
      {children}
    </DashboardShell>
  );
}
