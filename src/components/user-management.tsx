"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2, UserPlus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { criarUsuario, removerUsuario, alterarRole, type UserItem } from "@/app/actions";
import { type Role, ROLE_OPTIONS, ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  gestor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  usuario: "bg-muted text-muted-foreground",
};

export function UserManagement({
  users,
  currentUserId,
}: {
  users: UserItem[];
  currentUserId: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("usuario");
  const [showPassword, setShowPassword] = useState(false);
  const [creating, startCreating] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startRemoving] = useTransition();
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [, startChangingRole] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    startCreating(async () => {
      const res = await criarUsuario(email.trim(), password, role);
      if (res.ok) {
        toast.success("Usuário criado com sucesso", {
          description: `${email.trim()} · ${ROLE_LABELS[role]}`,
        });
        setEmail("");
        setPassword("");
        setRole("usuario");
      } else {
        toast.error("Erro ao criar usuário", { description: res.error });
      }
    });
  }

  function handleRemove(user: UserItem) {
    setRemovingId(user.id);
    startRemoving(async () => {
      const res = await removerUsuario(user.id);
      if (res.ok) {
        toast.success("Usuário removido", { description: user.email });
      } else {
        toast.error("Erro ao remover usuário", { description: res.error });
      }
      setRemovingId(null);
    });
  }

  function handleRoleChange(user: UserItem, newRole: Role) {
    setChangingRoleId(user.id);
    startChangingRole(async () => {
      const res = await alterarRole(user.id, newRole);
      if (res.ok) {
        toast.success("Perfil atualizado", {
          description: `${user.email} → ${ROLE_LABELS[newRole]}`,
        });
      } else {
        toast.error("Erro ao alterar perfil", { description: res.error });
      }
      setChangingRoleId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Formulário de criação */}
      <form onSubmit={handleCreate} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@empresa.com.br"
              required
              disabled={creating}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Senha inicial</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 6 caracteres"
                minLength={6}
                required
                disabled={creating}
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
        </div>

        {/* Seletor de perfil */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Perfil</label>
          <div className="flex gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                disabled={creating}
                className={cn(
                  "flex-1 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                  role === opt.value
                    ? "border-foreground/30 bg-foreground/8 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {role === "admin" && "Acesso total: dashboards, lançamento de dados e gestão de usuários."}
            {role === "gestor" && "Pode visualizar dashboards e lançar dados. Não gerencia usuários."}
            {role === "usuario" && "Somente visualização dos dashboards."}
          </p>
        </div>

        <button
          type="submit"
          disabled={creating || !email || !password}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          {creating ? "Criando…" : "Criar Usuário"}
        </button>
      </form>

      {/* Lista de usuários */}
      {users.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Usuários ativos ({users.length})
          </p>
          <div className="divide-y rounded-lg border border-border">
            {users.map((u) => {
              const isCurrentUser = u.id === currentUserId;
              const isRemoving = removingId === u.id;
              const isChangingRole = changingRoleId === u.id;
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{u.email}</p>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", ROLE_BADGE[u.role])}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </div>
                    {isCurrentUser && (
                      <p className="text-[11px] text-muted-foreground">Você</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Seletor de role inline */}
                    {!isCurrentUser && (
                      <div className="relative">
                        {isChangingRole ? (
                          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                            className="h-7 rounded-md border border-border bg-background px-2 pr-6 text-xs text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer hover:border-foreground/30"
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* Botão remover */}
                    <button
                      type="button"
                      onClick={() => handleRemove(u)}
                      disabled={isCurrentUser || isRemoving}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        isCurrentUser
                          ? "text-muted-foreground/40 cursor-not-allowed"
                          : "text-destructive hover:bg-destructive/10"
                      )}
                      title={isCurrentUser ? "Não é possível remover sua própria conta" : "Remover usuário"}
                    >
                      {isRemoving ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                      {!isRemoving && "Remover"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
