import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordChange } from "@/components/password-change";

export default function SegurancaPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground text-base">Alterar Senha</CardTitle>
        <CardDescription>
          Confirme sua senha atual e defina uma nova. A alteração entra em vigor imediatamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PasswordChange />
      </CardContent>
    </Card>
  );
}
