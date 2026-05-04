"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import { loadMeasurements, getValueAt } from "@/lib/data-source";
import { INDICATORS } from "@/lib/indicators";
import { type Role, getRoleFromMetadata } from "@/lib/roles";

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

  // Verificar sessão e role
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada. Faça login novamente." };

  const role = getRoleFromMetadata(user.app_metadata);
  if (role === "usuario") {
    return { ok: false, error: "Sem permissão para lançar dados." };
  }

  // Usar admin client para escrita — bypass RLS após auth verificado
  const admin = createAdminClient();

  if (value === null || Number.isNaN(value)) {
    const { error } = await admin
      .from("medicoes")
      .delete()
      .eq("indicator_id", indicatorId)
      .eq("period", period);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/", "layout");
    return { ok: true, value: 0 };
  }

  const { error } = await admin
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

export type UserItem = {
  id: string;
  email: string;
  created_at: string;
  role: Role;
};

export async function listarUsuarios(): Promise<UserItem[]> {
  if (!SUPABASE_ENABLED) return [];
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) return [];
    return (data.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      role: getRoleFromMetadata(u.app_metadata as Record<string, unknown>),
    }));
  } catch {
    return [];
  }
}

export async function criarUsuario(
  email: string,
  password: string,
  role: Role = "usuario"
): Promise<{ ok: boolean; error?: string }> {
  if (!SUPABASE_ENABLED) return { ok: false, error: "Supabase não configurado" };

  // Verificar se quem chama é admin
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };
  const callerRole = getRoleFromMetadata(user.app_metadata);
  if (callerRole !== "admin") return { ok: false, error: "Sem permissão para criar usuários." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function removerUsuario(
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!SUPABASE_ENABLED) return { ok: false, error: "Supabase não configurado" };

  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  // Impede auto-remoção
  if (user.id === userId) return { ok: false, error: "Você não pode remover sua própria conta." };

  // Verificar se quem chama é admin
  const callerRole = getRoleFromMetadata(user.app_metadata);
  if (callerRole !== "admin") return { ok: false, error: "Sem permissão para remover usuários." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function alterarRole(
  userId: string,
  role: Role
): Promise<{ ok: boolean; error?: string }> {
  if (!SUPABASE_ENABLED) return { ok: false, error: "Supabase não configurado" };

  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  // Verificar se quem chama é admin
  const callerRole = getRoleFromMetadata(user.app_metadata);
  if (callerRole !== "admin") return { ok: false, error: "Sem permissão para alterar perfis." };

  // Impede alterar o próprio perfil
  if (user.id === userId) return { ok: false, error: "Você não pode alterar seu próprio perfil." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function signOut() {
  if (!SUPABASE_ENABLED) return;
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
