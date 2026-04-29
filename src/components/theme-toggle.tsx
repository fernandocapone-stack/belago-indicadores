"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="size-9 rounded-lg border" />
      </div>
    );
  }

  const current = theme === "system" ? resolvedTheme : theme;
  const next = current === "dark" ? "light" : "dark";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme(next)}
        aria-label="Alternar tema"
      >
        {current === "dark" ? <Sun /> : <Moon />}
        <span>{current === "dark" ? "Tema claro" : "Tema escuro"}</span>
      </Button>
    </div>
  );
}
