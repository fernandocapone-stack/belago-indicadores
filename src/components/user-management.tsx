"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { removerUsuario, alterarRole, type UserItem } from "@/app/actions";
import { type Role, ROLE_LABELS } from "@/lib/roles";
import { UserCreateDrawer } from "./user-create-drawer";
import { RoleSelect } from "./role-select";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<Role, string> = {
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  gestor: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  usuario: "bg-muted text-muted-foreground",
};

export function UserManagement({
  users,
  currentUserId,
}: {
  users: UserItem[];
  currentUserId: string;
}) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startRemoving] = useTransition();
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [, startChangingRole] = useTransition();

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
    <div className="space-y-5">
      {/* CTA */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {users.length} usuário{users.length !== 1 ? "s" : ""} ativo{users.length !== 1 ? "s" : ""}
        </p>
        <UserCreateDrawer />
      </div>

      {/* Lista */}
      {users.length > 0 ? (
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
                    <div className="flex items-center">
                      {isChangingRole ? (
                        <div className="flex h-7 w-[80px] items-center justify-center">
                          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <RoleSelect
                          value={u.role}
                          onChange={(newRole) => handleRoleChange(u, newRole)}
                        />
                      )}
                    </div>
                  )}

                  {/* Botão remover — só ícone */}
                  <button
                    type="button"
                    onClick={() => handleRemove(u)}
                    disabled={isCurrentUser || isRemoving}
                    className={cn(
                      "flex items-center justify-center rounded-md p-1.5 transition-colors",
                      isCurrentUser
                        ? "text-muted-foreground/30 cursor-not-allowed"
                        : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    )}
                    title={isCurrentUser ? "Não é possível remover sua própria conta" : "Remover usuário"}
                  >
                    {isRemoving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum usuário cadastrado ainda.
        </p>
      )}
    </div>
  );
}
