import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserManagement } from "@/components/user-management";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import type { UserItem } from "@/app/actions";

async function getPageData(): Promise<{ userId: string; users: UserItem[] }> {
  if (!SUPABASE_ENABLED) return { userId: "", users: [] };
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id ?? "";

    const admin = createAdminClient();
    const { data: usersData } = await admin.auth.admin.listUsers();
    const users: UserItem[] = (usersData?.users ?? [])
      .map((u) => ({ id: u.id, email: u.email ?? "", created_at: u.created_at }))
      .sort((a, b) => a.email.localeCompare(b.email));

    return { userId, users };
  } catch {
    return { userId: "", users: [] };
  }
}

export default async function UsuariosPage() {
  const { userId, users } = await getPageData();

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
