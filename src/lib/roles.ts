export type Role = "admin" | "gestor" | "usuario";

/**
 * Extrai o role do app_metadata do Supabase.
 * Fallback para "admin" para backward compatibility com contas existentes
 * que ainda não têm o campo definido.
 */
export function getRoleFromMetadata(
  app_metadata?: Record<string, unknown> | null
): Role {
  const r = app_metadata?.role;
  if (r === "gestor") return "gestor";
  if (r === "usuario") return "usuario";
  return "admin";
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin",
  gestor: "Gestor",
  usuario: "Usuário",
};

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "gestor", label: "Gestor" },
  { value: "usuario", label: "Usuário" },
];
