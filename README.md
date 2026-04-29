# Belago Indicadores

Painel de indicadores operacionais da Belago — V3 (Supabase + lançamento mensal).

Construído em Next.js 16 + React 19 + Tailwind v4, alinhado visualmente com a `Belago-platform`.

## Stack

- **Next.js 16.2.3** + **React 19** (Turbopack)
- **TypeScript** estrito
- **Tailwind v4** + design tokens em `globals.css`
- **base-ui** + componentes inspirados em shadcn (`base-nova`)
- **Supabase** (Postgres + Auth + RLS)
- **Recharts** para gráficos
- **next-themes** (light/dark)
- **lucide-react** para ícones

## Setup completo (primeira vez)

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar projeto Supabase

> **Importante:** este produto deve ter seu **próprio projeto Supabase**, separado da `Belago-platform`. Não reutilize o projeto da plataforma — as tabelas e RLS são distintos.

1. Acesse https://supabase.com → New Project (crie um projeto novo, não reutilize)
2. Anote a `URL`, `anon key` e `service_role key` (Settings → API)

### 3. Rodar a migration

No Supabase Dashboard → SQL Editor → cole o conteúdo de `supabase/migration.sql` e execute.

### 4. Criar `.env.local`

```bash
cp .env.local.example .env.local
```

Preencha com os valores do seu projeto Supabase.

### 5. Importar dados históricos (opcional)

Carrega os 28 indicadores e ~560 medições da planilha Belago para o Supabase.

```bash
pip install requests openpyxl
python scripts/extract_data.py     # gera src/lib/data/measurements.json
python scripts/seed_supabase.py    # envia para Supabase
```

### 6. Criar usuário inicial

Supabase Dashboard → Authentication → Users → Add user → "Create new user".
Use email/senha — esses serão os dados de login no painel.

### 7. Rodar

```bash
npm run dev          # http://localhost:3000
```

## Como funciona

- **Sem `.env.local`:** o painel roda em modo "fallback" lendo o JSON estático em `src/lib/data/measurements.json`. Útil para desenvolvimento e demo, mas o lançamento mensal não persiste.
- **Com `.env.local` configurado:** as páginas leem do Supabase. Login obrigatório (Supabase Auth). Lançamento mensal persiste com auditoria.

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Visão Geral — destaques, tendências e todos os indicadores |
| `/atendimento` | TMA, TME, disponibilidade, volume, abandono |
| `/tickets` | Volume, resolvidos, % SLA |
| `/niveis` | Distribuição N1/N2/N3/Área Negócio |
| `/aging` | Resolução em 1, 2, 3, 4, 5, mais de 5 dias |
| `/admin/lancamento` | Formulário mensal de entrada de dados (com Supabase) |
| `/login` | Tela de login |

## Banco de dados

Três tabelas (`supabase/migration.sql`):

- **`indicadores`** — catálogo: `id`, `label`, `kind`, `category`, `direction`, `meta`, `description`, `band_good`, `band_warn`, `ordem`
- **`medicoes`** — valores: `(indicator_id, period)` PK, `value`, `updated_by`, `updated_at`
- **`medicoes_auditoria`** — histórico: trigger registra cada INSERT/UPDATE com `value_old`, `value_new`, `changed_by`, `changed_at`

RLS atual: qualquer usuário autenticado pode ler e escrever. Multi-papel fica para depois.

## Arquitetura

```
src/
  app/
    layout.tsx                  # shell + tema
    page.tsx                    # Visão Geral
    atendimento/page.tsx
    tickets/page.tsx
    niveis/page.tsx
    aging/page.tsx
    login/page.tsx              # auth
    admin/lancamento/page.tsx   # formulário mensal
    actions.ts                  # server actions (saveMedicao, signOut)
    globals.css                 # tokens light/dark
  components/
    app-shell.tsx               # sidebar + header + theme toggle + logout
    kpi-card.tsx                # card com status semafórico, MoM, YoY
    trend-chart.tsx             # linha + linha YoY tracejada
    period-filter.tsx
    category-page.tsx
    lancamento-form.tsx         # input com auto-save
    theme-provider.tsx
    ui/                         # button, card, badge, input, label, sonner
  lib/
    indicators.ts               # catálogo (estático, do JSON) + helpers
    data-source.ts              # loadMeasurements (Supabase OU JSON fallback)
    format.ts                   # formatação + status + delta
    utils.ts                    # cn()
    data/measurements.json
    supabase/
      client.ts, server.ts, middleware.ts, config.ts, database.types.ts
  proxy.ts                      # roteia auth para o middleware do Supabase
scripts/
  extract_data.py               # extração Excel → JSON
  seed_supabase.py              # JSON → Supabase
supabase/
  migration.sql                 # schema + RLS + triggers
```

## V3 — escopo entregue

- **Backend Supabase** — schema, RLS, auditoria, server clients (server/client/middleware).
- **Auth** — login com Supabase, middleware protege todas as rotas exceto `/login`.
- **Página `/admin/lancamento`** — formulário com inputs por categoria, auto-save no blur, formato adaptativo (mm:ss para tempo, % para percent, número para integer).
- **Camada de dados híbrida** — `loadMeasurements()` lê do Supabase quando configurado, cai para JSON estático quando não.
- **Auditoria automática** — trigger SQL grava cada alteração em `medicoes_auditoria`.
- **Sidebar** — entrada "Lançar dados" + botão de logout.

## V1 (visualização) — também entregue

- 28 indicadores em 4 categorias, 20 períodos (ago/24 → mar/26)
- Filtro de período por querystring
- Comparação MoM e YoY nos cards e nos gráficos (linha tracejada)
- Status semafórico baseado em metas
- Light/dark mode
- Design responsivo (sidebar desktop fixa, header em mobile)

## Suposições documentadas (precisam validação com o cliente)

1. **Direção dos indicadores** — `up` (maior melhor) ou `down` (menor melhor) inferida do nome. Ver `META_OVERRIDES` em `src/lib/indicators.ts` e `scripts/seed_supabase.py`.
2. **Metas** — vindas da coluna "Meta" da planilha. Faltam metas para taxa de abandono (heurística: ≤2% bom, ≤5% atenção) e aging (neutro).
3. **Status semafórico** — verde se ≥ meta, amarelo ≥ 85% da meta, vermelho abaixo. Cinza sem meta.
4. **Comparação YoY** — mesmo mês do ano anterior. Sem dado → "—".
5. **Tempo médio** — armazenado em segundos. Formato no input: `mm:ss` ou `hh:mm:ss`.
6. **Taxa de Abandono em abr/2025** — original como string `"0.91%"`, parser converte para 0.0091. **Sugerir padronizar.**
7. **Aba "Calculo PBI"** — extraída mas não exibida. Confirmar com cliente se é indicador novo.

## Próximos passos sugeridos

### V4 — completude + multi-papel
- [ ] Incorporar dados da planilha Quattrus (FCR, SLA N1/N2, CSAT, backlog, incidentes, ativos).
- [ ] Página dedicada para CSAT (categorias + estrelas).
- [ ] Multi-papel (Belago / Quattrus / Cliente) com RLS específico.
- [ ] Comentários/observações por mês.
- [ ] Tela `/admin/historico` exibindo `medicoes_auditoria`.

### V5 — automação + alertas
- [ ] Export PDF da Visão Geral mensal.
- [ ] Alertas (email) quando indicador entra em vermelho.
- [ ] Plano de ação por indicador.
- [ ] Integração via API com a fonte real (ServiceNow, Freshdesk, etc.) — eliminar lançamento manual.

## Convenções

- Sem comentários em código a menos que o "porquê" não seja óbvio.
- Componentes server por padrão; `"use client"` apenas em filtros, formulários, tema, gráficos.
- Datas como string `YYYY-MM`.
- Acessibilidade: textos pt-BR, atributos `aria-*` nos toggles.
