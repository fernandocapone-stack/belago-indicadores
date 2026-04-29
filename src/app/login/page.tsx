"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SUPABASE_ENABLED } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEntrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      setErro("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Belago</h1>
          <p className="mt-1 text-sm font-medium text-muted-foreground">Painel de Indicadores</p>
          <p className="mt-6 text-sm text-muted-foreground">Entre com sua conta</p>
        </div>

        {!SUPABASE_ENABLED && (
          <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
            Supabase não está configurado. Defina <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> no <code>.env.local</code> e reinicie o
            servidor.
          </div>
        )}

        <form onSubmit={handleEntrar} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="nome@empresa.com.br"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || !SUPABASE_ENABLED}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              disabled={loading || !SUPABASE_ENABLED}
            />
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}

          <Button type="submit" className="w-full" disabled={loading || !SUPABASE_ENABLED}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Entrando…
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">Carregando…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
