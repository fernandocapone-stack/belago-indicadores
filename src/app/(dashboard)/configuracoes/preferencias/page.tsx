import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";

async function getCurrentUserEmail(): Promise<string | null> {
  if (!SUPABASE_ENABLED) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export default async function PreferenciasPage() {
  const email = await getCurrentUserEmail();

  return (
    <div className="space-y-4">
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
        <CardContent className="text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">E-mail</span>
            <span className="font-medium">{email ?? "—"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
