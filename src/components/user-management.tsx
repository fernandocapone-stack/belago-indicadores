"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { criarUsuario, removerUsuario, type UserItem } from "@/app/actions";
import { cn } from "@/lib/utils";

export function UserManagement({
  users,
  currentUserId,
}: {
  users: UserItem[];
  currentUserId: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, startCreating] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startRemoving] = useTransition();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    startCreating(async () => {
      const res = await criarUsuario(email.trim(), password);
      if (res.ok) {
        toast.success("Usuário criado com sucesso", { description: email.trim() });
        setEmail("");
        setPassword("");
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
              minLength={6}
              required
              disabled={creating}
              className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-50"
            />
          </div>
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
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.email}</p>
                    {isCurrentUser && (
                      <p className="text-[11px] text-muted-foreground">Você</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(u)}
                    disabled={isCurrentUser || isRemoving}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors shrink-0",
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
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
