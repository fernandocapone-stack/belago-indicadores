"use client";

import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function PasswordChange() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit = current.length > 0 && next.length >= 6 && next === confirm && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);

    // Reautenticar com a senha atual
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      toast.error("Sessão inválida. Faça login novamente.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });

    if (signInError) {
      toast.error("Senha atual incorreta.");
      setLoading(false);
      return;
    }

    // Atualizar para a nova senha
    const { error } = await supabase.auth.updateUser({ password: next });

    if (error) {
      toast.error("Erro ao alterar senha", { description: error.message });
    } else {
      toast.success("Senha alterada com sucesso");
      setCurrent("");
      setNext("");
      setConfirm("");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      {/* Senha atual */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Senha atual</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
            className="h-9 w-full rounded-md border border-border bg-background px-3 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute inset-y-0 right-2.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {showCurrent ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Nova senha */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Nova senha</label>
        <div className="relative">
          <input
            type={showNext ? "text" : "password"}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="mínimo 6 caracteres"
            autoComplete="new-password"
            minLength={6}
            disabled={loading}
            className="h-9 w-full rounded-md border border-border bg-background px-3 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowNext((v) => !v)}
            className="absolute inset-y-0 right-2.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNext ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Confirmar nova senha */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Confirmar nova senha</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={loading}
          className={`h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50 ${
            mismatch ? "border-destructive" : "border-border"
          }`}
        />
        {mismatch && (
          <p className="text-[11px] text-destructive">As senhas não coincidem.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex items-center gap-2 rounded-md border border-border bg-foreground/8 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/12 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? "Salvando…" : "Alterar Senha"}
      </button>
    </form>
  );
}
