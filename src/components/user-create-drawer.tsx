"use client";

import { useState, useTransition } from "react";
import { UserPlus, Loader2, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { criarUsuario } from "@/app/actions";
import { type Role, ROLE_OPTIONS } from "@/lib/roles";

export function UserCreateDrawer() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("usuario");
  const [showPassword, setShowPassword] = useState(false);
  const [creating, startCreating] = useTransition();

  const canSubmit = email.length > 0 && password.length >= 6 && !creating;

  function handleClose() {
    setOpen(false);
    setEmail("");
    setPassword("");
    setRole("usuario");
    setShowPassword(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    startCreating(async () => {
      const res = await criarUsuario(email.trim(), password, role);
      if (res.ok) {
        const roleLabel = ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
        toast.success("Usuário criado com sucesso", {
          description: `${email.trim()} · ${roleLabel}`,
        });
        handleClose();
      } else {
        toast.error("Erro ao criar usuário", { description: res.error });
      }
    });
  }

  const roleDescription: Record<Role, string> = {
    admin: "Acesso total: dashboards, lançamento de dados e gestão de usuários.",
    gestor: "Pode visualizar dashboards e lançar dados. Não gerencia usuários.",
    usuario: "Somente visualização dos dashboards.",
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <UserPlus className="size-4" />
        Adicionar Usuário
      </button>

      <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex flex-col gap-0 p-0 sm:max-w-[420px]"
        >
          {/* Cabeçalho */}
          <SheetHeader className="flex-row items-start justify-between gap-4 border-b px-6 py-4 space-y-0">
            <div className="space-y-0.5">
              <SheetTitle className="text-base font-semibold">Adicionar Usuário</SheetTitle>
              <SheetDescription className="text-xs">
                O usuário acessa com as credenciais definidas aqui e pode alterar a senha depois.
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mt-0.5 shrink-0"
            >
              <X className="size-4" />
              <span className="sr-only">Fechar</span>
            </button>
          </SheetHeader>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              {/* E-mail */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@empresa.com.br"
                  required
                  disabled={creating}
                  autoComplete="off"
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
                />
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Senha inicial</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="mínimo 6 caracteres"
                    minLength={6}
                    required
                    disabled={creating}
                    autoComplete="new-password"
                    className="h-9 w-full rounded-md border border-border bg-background px-3 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-2.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </div>
              </div>

              {/* Perfil */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Perfil</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  disabled={creating}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{roleDescription[role]}</p>
              </div>
            </div>

            {/* Rodapé */}
            <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating && <Loader2 className="size-4 animate-spin" />}
                {creating ? "Criando…" : "Criar Usuário"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
