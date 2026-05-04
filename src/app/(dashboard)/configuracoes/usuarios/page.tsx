import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagement } from "@/components/user-management";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import { getRoleFromMetadata } from "@/lib/roles";
import type { UserItem } from "@/app/actions";

async function getPageData(): Promise<{ userId: string; users: UserItem[] } | null> {
  if (!SUPABASE_ENABLED) return { userId: "", users: [] };
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return null;

    // Guard: apenas admin pode acessar esta página
    const role = getRoleFromMetadata(user.app_metadata as Record<string, unknown>);
    if (role !== "admin") return null;

    const admin = createAdminClient();
    const { data: usersData } = await admin.auth.admin.listUsers();
    const users: UserItem[] = (usersData?.users ?? [])
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        created_at: u.created_at,
        role: getRoleFromMetadata(u.app_metadata as Record<string, unknown>),
      }))
      .sort((a, b) => a.email.localeCompare(b.email));

    return { userId: user.id, users };
  } catch {
    return null;
  }
}

export default async function UsuariosPage() {
  const data = await getPageData();

  if (!data) {
    redirect("/configuracoes/preferencias");
  }

  const { userId, users } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground text-base">Usuários</CardTitle>
        <CardDescription>
          Crie e gerencie os usuários com acesso ao painel. O usuário recebe o e-mail e
          senha que você definir e pode alterá-la em Segurança após o primeiro acesso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UserManagement users={users} currentUserId={userId} />
      </CardContent>
    </Card>
  );
}
