import { ThemeToggle } from "@/components/theme-toggle";
import { UserManagement } from "@/components/user-management";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import type { UserItem } from "@/app/actions";

async function getPageData(): Promise<{
  email: string | null;
  userId: string;
  users: UserItem[];
}> {
  if (!SUPABASE_ENABLED) return { email: null, userId: "", users: [] };
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email ?? null;
    const userId = data.user?.id ?? "";

    const admin = createAdminClient();
    const { data: usersData } = await admin.auth.admin.listUsers();
    const users: UserItem[] = (usersData?.users ?? [])
      .map((u) => ({ id: u.id, email: u.email ?? "", created_at: u.created_at }))
      .sort((a, b) => a.email.localeCompare(b.email));

    return { email, userId, users };
  } catch {
    return { email: null, userId: "", users: [] };
  }
}

export default async function ConfiguracoesPage() {
  const { email, userId, users } = await getPageData();

  return (
    <div className="space-y-6 max-w-3xl">
      <p className="text-sm text-muted-foreground">
        Preferências da plataforma e dados da sua conta.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base">Aparência</CardTitle>
          <CardDescription>
            Escolha entre tema claro e escuro. A preferência fica salva neste navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base">Conta</CardTitle>
          <CardDescription>Informações da sessão atual.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">E-mail</span>
            <span className="font-medium">{email ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-base">Usuários</CardTitle>
          <CardDescription>
            Crie e gerencie os usuários com acesso ao painel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserManagement users={users} currentUserId={userId} />
        </CardContent>
      </Card>
    </div>
  );
}
