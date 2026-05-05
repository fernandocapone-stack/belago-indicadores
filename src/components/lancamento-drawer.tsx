"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import {
  Plus,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/ui/progress";
import { LancamentoRow } from "@/components/lancamento-form";
import { getMedicoesPorPeriodo } from "@/app/actions";
import { INDICATORS, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/indicators";
import { formatPeriodLong } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Retorna o índice do período padrão: primeiro mês sem dados após o último com dados */
function getDefaultIdx(lastDataPeriod: string | undefined, periods: string[]): number {
  if (!periods.length) return 0;
  if (lastDataPeriod) {
    const lastIdx = periods.indexOf(lastDataPeriod);
    if (lastIdx >= 0 && lastIdx + 1 < periods.length) return lastIdx + 1;
    if (lastIdx >= 0) return lastIdx; // já está no último
  }
  // fallback: mês atual
  const today = new Date();
  const curr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const currIdx = periods.indexOf(curr);
  return currIdx >= 0 ? currIdx : periods.length - 1;
}

function capitalize(s: string) {
  return s.replace(/^./, (c) => c.toUpperCase());
}

export function LancamentoDrawer({
  periods,
  lastDataPeriod,
}: {
  periods: string[];
  lastDataPeriod?: string;
}) {
  const defaultIdx = getDefaultIdx(lastDataPeriod, periods);

  const [open, setOpen] = useState(false);
  const [periodIdx, setPeriodIdx] = useState(defaultIdx);
  const [measurements, setMeasurements] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(false);
  const [filledMap, setFilledMap] = useState<Record<string, boolean>>({});
  const [savedCount, setSavedCount] = useState(0); // campos salvos nesta sessão
  const [, startTransition] = useTransition();
  // Guarda quantos estavam preenchidos quando o período foi carregado
  const initialFilledRef = useRef(0);

  const selectedPeriod = periods[periodIdx] ?? "";

  /** Carrega medições para um índice de período */
  function loadPeriod(idx: number) {
    const period = periods[idx];
    if (!period) return;
    setFilledMap({});
    setMeasurements({});
    setSavedCount(0);
    setLoading(true);
    startTransition(async () => {
      const data = await getMedicoesPorPeriodo(period);
      setMeasurements(data);
      const initial: Record<string, boolean> = {};
      let count = 0;
      for (const [k, v] of Object.entries(data)) {
        initial[k] = v != null;
        if (v != null) count++;
      }
      initialFilledRef.current = count;
      setFilledMap(initial);
      setLoading(false);
    });
  }

  // Carrega automaticamente ao abrir o drawer
  useEffect(() => {
    if (open) {
      setPeriodIdx(defaultIdx);
      loadPeriod(defaultIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handlePrev() {
    if (periodIdx <= 0) return;
    const next = periodIdx - 1;
    setPeriodIdx(next);
    loadPeriod(next);
  }

  function handleNext() {
    if (periodIdx >= periods.length - 1) return;
    const next = periodIdx + 1;
    setPeriodIdx(next);
    loadPeriod(next);
  }

  const handleSaved = useCallback(
    (indicatorId: string, value: number | null) => {
      setFilledMap((prev) => ({ ...prev, [indicatorId]: value != null }));
      setSavedCount((n) => n + 1);
    },
    []
  );

  const filledCount = Object.values(filledMap).filter(Boolean).length;
  const totalCount = INDICATORS.length;
  const pct = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;
  const allFilled = filledCount === totalCount && totalCount > 0;
  const isEditing = !loading && initialFilledRef.current > 0;
  const hasChanges = savedCount > 0;

  function handleSave() {
    const label = selectedPeriod ? capitalize(formatPeriodLong(selectedPeriod)) : "período";
    toast.success(`Lançamento salvo — ${label}`, {
      description: `${savedCount} campo${savedCount !== 1 ? "s" : ""} atualizado${savedCount !== 1 ? "s" : ""}`,
      duration: 4000,
    });
    setSavedCount(0);
  }

  function handleCancel() {
    setOpen(false);
  }

  return (
    <>
      {/* Botão CTA na sidebar */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
      >
        <Plus className="size-4 shrink-0" />
        Lançar Dados
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          className="flex flex-col gap-0 p-0 sm:max-w-[500px]"
        >
          {/* ── Cabeçalho ───────────────────────────────────── */}
          <SheetHeader className="flex-row items-start justify-between gap-4 border-b px-6 py-4 space-y-0">
            <div className="space-y-0.5">
              <SheetTitle className="text-base font-semibold">Lançar Dados</SheetTitle>
              <SheetDescription className="text-xs">
                Navegue entre os meses e preencha os indicadores.
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mt-0.5 shrink-0"
            >
              <X className="size-4" />
              <span className="sr-only">Fechar</span>
            </button>
          </SheetHeader>

          {/* ── Navegador de mês ────────────────────────────── */}
          <div className="border-b px-4 py-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
              Período
            </p>
            <div className="flex items-center gap-2">
              {/* Seta anterior */}
              <button
                type="button"
                onClick={handlePrev}
                disabled={periodIdx <= 0}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronLeft className="size-4" />
              </button>

              {/* Mês atual + badge */}
              <div className="flex flex-1 flex-col items-center gap-1 text-center">
                <span className="text-sm font-semibold leading-none">
                  {selectedPeriod ? capitalize(formatPeriodLong(selectedPeriod)) : "—"}
                </span>
                {!loading && selectedPeriod && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      isEditing
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : allFilled
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isEditing ? (
                      <>
                        <Pencil className="size-2.5" />
                        Editando dados anteriores
                      </>
                    ) : allFilled ? (
                      <>
                        <CheckCircle2 className="size-2.5" />
                        Completo
                      </>
                    ) : (
                      "Novo lançamento"
                    )}
                  </span>
                )}
              </div>

              {/* Seta próximo */}
              <button
                type="button"
                onClick={handleNext}
                disabled={periodIdx >= periods.length - 1}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* ── Barra de progresso ──────────────────────────── */}
          {!loading && (
            <div className="border-b bg-muted/30 px-6 py-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {filledCount} de {totalCount} indicadores preenchidos
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold tabular-nums",
                    allFilled ? "text-success" : "text-foreground"
                  )}
                >
                  {pct}%
                </span>
              </div>
              <Progress value={pct} className="gap-0">
                <ProgressTrack className="h-1.5">
                  <ProgressIndicator
                    className={cn(allFilled ? "bg-success" : "bg-primary")}
                  />
                </ProgressTrack>
              </Progress>
            </div>
          )}

          {/* ── Corpo com formulário ────────────────────────── */}
          <div className="flex-1 overflow-y-auto">
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Formulário por categoria */}
            {!loading && (
              <div>
                {CATEGORY_ORDER.map((cat) => {
                  const inds = INDICATORS.filter((i) => i.category === cat);
                  const catFilled = inds.filter((i) => filledMap[i.id]).length;
                  const catComplete = catFilled === inds.length;
                  return (
                    <div key={cat} className="border-b last:border-b-0">
                      {/* Cabeçalho de categoria sticky */}
                      <div className="sticky top-0 z-10 flex items-center justify-between bg-muted/70 px-6 py-2.5 backdrop-blur">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {CATEGORY_LABELS[cat]}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-medium tabular-nums flex items-center gap-1",
                            catComplete ? "text-success" : "text-muted-foreground"
                          )}
                        >
                          {catFilled}/{inds.length}
                          {catComplete && <CheckCircle2 className="size-3" />}
                        </span>
                      </div>

                      {/* Linhas */}
                      <div className="px-6 divide-y">
                        {inds.map((ind) => (
                          <LancamentoRow
                            key={`${ind.id}-${selectedPeriod}`}
                            indicator={ind}
                            period={selectedPeriod}
                            initialValue={measurements[ind.id] ?? null}
                            onSaved={handleSaved}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Rodapé ──────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
            {/* Resumo à esquerda */}
            {!loading && (
              allFilled ? (
                <span className="flex items-center gap-1.5 text-sm font-medium text-success">
                  <CheckCircle2 className="size-4" />
                  Todos preenchidos
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {totalCount - filledCount} campo{totalCount - filledCount !== 1 ? "s" : ""} em aberto
                </span>
              )
            )}
            {loading && <span />}

            {/* CTAs à direita */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={hasChanges ? handleSave : undefined}
                disabled={!hasChanges}
                className={cn(
                  "rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors",
                  hasChanges
                    ? "bg-foreground/8 text-foreground hover:bg-foreground/12"
                    : "text-muted-foreground opacity-50 cursor-not-allowed"
                )}
              >
                Salvar
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
