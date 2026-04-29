"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { saveMedicao } from "@/app/actions";
import type { Indicator } from "@/lib/indicators";
import { formatValue } from "@/lib/format";
import { cn } from "@/lib/utils";

type Status = "idle" | "saving" | "saved" | "error";

function valueToInput(value: number | null, kind: Indicator["kind"]): string {
  if (value == null) return "";
  if (kind === "percent") {
    return (value * 100).toFixed(2).replace(/\.?0+$/, "");
  }
  if (kind === "time") {
    const total = Math.max(0, Math.round(value));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return String(value);
}

function parseInput(raw: string, kind: Indicator["kind"]): number | null {
  const s = raw.trim().replace(",", ".");
  if (s === "") return null;
  if (kind === "time") {
    const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
    if (m) {
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      const c = m[3] ? parseInt(m[3], 10) : null;
      if (c !== null) return a * 3600 + b * 60 + c;
      return a * 60 + b;
    }
    const num = Number(s);
    if (!Number.isNaN(num)) return num;
    return null;
  }
  if (kind === "percent") {
    const cleaned = s.endsWith("%") ? s.slice(0, -1) : s;
    const num = Number(cleaned);
    if (Number.isNaN(num)) return null;
    return num / 100;
  }
  const num = Number(s);
  if (Number.isNaN(num)) return null;
  return num;
}

function placeholderFor(kind: Indicator["kind"]): string {
  if (kind === "time") return "mm:ss ou hh:mm:ss";
  if (kind === "percent") return "ex: 85,5";
  return "ex: 1234";
}

export function LancamentoRow({
  indicator,
  period,
  initialValue,
  onSaved,
}: {
  indicator: Indicator;
  period: string;
  initialValue: number | null;
  onSaved?: (indicatorId: string, value: number | null) => void;
}) {
  const [raw, setRaw] = useState<string>(valueToInput(initialValue, indicator.kind));
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [savedValue, setSavedValue] = useState<number | null>(initialValue);
  const [, startTransition] = useTransition();

  async function commit(rawValue: string) {
    const parsed = parseInput(rawValue, indicator.kind);
    if (rawValue.trim() !== "" && parsed === null) {
      setStatus("error");
      setErrorMsg("Formato inválido");
      return;
    }
    if (parsed === savedValue) {
      setStatus("idle");
      return;
    }
    setStatus("saving");
    setErrorMsg("");
    startTransition(async () => {
      const res = await saveMedicao(indicator.id, period, parsed);
      if (res.ok) {
        setSavedValue(parsed);
        setStatus("saved");
        onSaved?.(indicator.id, parsed);
        setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 1500);
      } else {
        setStatus("error");
        setErrorMsg(res.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-3 py-2 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{indicator.label}</div>
        {savedValue != null && (
          <div className="text-[11px] text-muted-foreground tabular-nums">
            atual: {formatValue(savedValue, indicator.kind)}
          </div>
        )}
      </div>
      <div className="relative">
        <input
          value={raw}
          onChange={(e) => {
            setRaw(e.target.value);
            if (status === "error" || status === "saved") setStatus("idle");
          }}
          onBlur={() => commit(raw)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          placeholder={placeholderFor(indicator.kind)}
          className={cn(
            "h-9 w-44 rounded-lg border bg-background px-3 pr-9 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors",
            status === "error" ? "border-destructive" : "border-border"
          )}
          inputMode={indicator.kind === "integer" ? "numeric" : "decimal"}
        />
        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
          {status === "saving" && (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
          )}
          {status === "saved" && <Check className="size-3.5 text-success" />}
          {status === "error" && <X className="size-3.5 text-destructive" />}
        </div>
      </div>
      {errorMsg && status === "error" && (
        <div className="text-[11px] text-destructive shrink-0 w-32">{errorMsg}</div>
      )}
    </div>
  );
}
