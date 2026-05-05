"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  PhoneCall,
  Tickets,
  Layers,
  CalendarClock,
  ChevronUp,
  ChevronLeft,
  Settings,
  LogOut,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions";
import { PeriodFilter } from "./period-filter";
import { Separator } from "./ui/separator";
import { LancamentoDrawer } from "./lancamento-drawer";
import type { Role } from "@/lib/roles";

const NAV = [
  { href: "/", label: "Visão Geral", title: "Visão Geral", icon: Activity },
  { href: "/atendimento", label: "Atendimento", title: "Atendimento Telefônico", icon: PhoneCall },
  { href: "/tickets", label: "Tickets", title: "Tickets", icon: Tickets },
  { href: "/niveis", label: "Resolução por Nível", title: "Resolução por Nível", icon: Layers },
  { href: "/aging", label: "Aging", title: "Aging de Resolução", icon: CalendarClock },
];

const PAGE_TITLES: Record<string, string> = {
  ...Object.fromEntries(NAV.map((n) => [n.href, n.title])),
  "/configuracoes": "Configurações",
  "/admin/lancamento": "Lançamento Mensal",
};

const HIDE_FILTER_PREFIXES = ["/configuracoes", "/admin/lancamento"];

const CONFIG_TABS = [
  { href: "/configuracoes/preferencias", label: "Preferências", roles: ["admin", "gestor", "usuario"] as Role[] },
  { href: "/configuracoes/usuarios", label: "Usuários", roles: ["admin"] as Role[] },
  { href: "/configuracoes/seguranca", label: "Segurança", roles: ["admin", "gestor", "usuario"] as Role[] },
];

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/configuracoes")) return "Configurações";
  const match = NAV.filter((n) => n.href !== "/" && pathname.startsWith(n.href)).sort(
    (a, b) => b.href.length - a.href.length
  )[0];
  return match?.title ?? "Belago Indicadores";
}

function shouldShowFilter(pathname: string): boolean {
  return !HIDE_FILTER_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function getInitial(email: string): string {
  return email.trim().charAt(0).toUpperCase() || "U";
}

export function DashboardShell({
  children,
  periods,
  defaultPeriod,
  lastDataPeriod,
  userEmail,
  userRole,
}: {
  children: React.ReactNode;
  periods: string[];
  defaultPeriod: string;
  lastDataPeriod: string;
  userEmail: string | null;
  userRole: Role;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Guarda o último pathname fora de configurações para o botão Voltar
  const prevPathRef = useRef("/");
  useEffect(() => {
    if (!pathname.startsWith("/configuracoes")) {
      prevPathRef.current = pathname;
    }
  }, [pathname]);

  const visibleConfigTabs = CONFIG_TABS.filter((tab) => tab.roles.includes(userRole));

  return (
    <div className="flex min-h-full">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground sticky top-0 h-screen">
        <div className="flex h-16 items-center border-b px-5">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Belago
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
          <NavSection items={NAV} pathname={pathname} />
          {userRole !== "usuario" && (
            <div className="pt-1">
              <LancamentoDrawer periods={periods} lastDataPeriod={lastDataPeriod} />
            </div>
          )}
        </nav>
        <UserDropdown email={userEmail} role={userRole} />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="relative h-16 border-b flex items-center px-4 md:px-6 bg-background/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2 shrink-0">
            {pathname.startsWith("/configuracoes") && (
              <button
                type="button"
                onClick={() => router.push(prevPathRef.current)}
                className="flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            <h1 className="text-lg md:text-xl font-semibold tracking-tight">
              {getPageTitle(pathname)}
            </h1>
          </div>
          {pathname.startsWith("/configuracoes") ? (
            <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
              {visibleConfigTabs.map((tab) => {
                const active = pathname.startsWith(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      active
                        ? "bg-foreground/8 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </nav>
          ) : shouldShowFilter(pathname) ? (
            <Suspense fallback={null}>
              <div className="ml-auto">
                <PeriodFilter defaultPeriod={defaultPeriod} periods={periods} />
              </div>
            </Suspense>
          ) : null}
        </header>
        <main className="flex-1 px-4 md:px-6 py-6">{children}</main>
      </div>
    </div>
  );
}

function NavSection({
  items,
  pathname,
}: {
  items: { href: string; label: string; title: string; icon: React.ElementType }[];
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-foreground/10 text-foreground font-medium"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            )}
          >
            <Icon className={cn("size-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function UserDropdown({ email, role }: { email: string | null; role: Role }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function handleSair() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const display = email || "Carregando...";
  const initial = email ? getInitial(email) : "";

  const roleLabel: Record<Role, string> = {
    admin: "Admin",
    gestor: "Gestor",
    usuario: "Usuário",
  };

  return (
    <div ref={ref} className="relative px-3 py-3 border-t border-sidebar-border">
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          <Link
            href="/configuracoes"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors hover:bg-accent"
          >
            <Settings className="size-4 text-muted-foreground" />
            Configurações
          </Link>
          <Separator />
          <button
            type="button"
            onClick={handleSair}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-accent"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent",
          open && "bg-sidebar-accent"
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {initial || <UserRound className="size-3.5" />}
        </span>
        <span className="flex-1 min-w-0 text-left">
          <span className="block truncate text-xs font-medium text-sidebar-foreground">{display}</span>
          <span className="block text-[10px] text-muted-foreground">{roleLabel[role]}</span>
        </span>
        <ChevronUp className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", !open && "rotate-180")} />
      </button>
    </div>
  );
}
