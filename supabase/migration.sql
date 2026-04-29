-- Belago Indicadores — Migration V3
-- Rode esse SQL no Supabase Dashboard → SQL Editor (uma vez por projeto).
-- Cria tabelas, índices, RLS e triggers.

-- =============================================================
-- 1. TABELAS
-- =============================================================

-- Catálogo de indicadores (alinhado com src/lib/data/measurements.json)
create table if not exists public.indicadores (
  id          text primary key,
  label       text not null,
  kind        text not null check (kind in ('time', 'percent', 'integer')),
  category    text not null check (category in ('atendimento', 'tickets', 'niveis', 'aging')),
  direction   text not null check (direction in ('up', 'down')),
  meta        numeric,
  description text,
  band_good   numeric,
  band_warn   numeric,
  ordem       integer not null default 0
);

-- Medições mensais — 1 valor por (indicator, period)
create table if not exists public.medicoes (
  indicator_id text not null references public.indicadores(id) on delete cascade,
  period       text not null,
  value        numeric not null,
  updated_by   uuid references auth.users(id),
  updated_at   timestamptz not null default now(),
  primary key (indicator_id, period),
  constraint period_format check (period ~ '^\d{4}-\d{2}$')
);

create index if not exists medicoes_period_idx on public.medicoes(period);
create index if not exists medicoes_indicator_idx on public.medicoes(indicator_id);

-- Auditoria — histórico de alterações
create table if not exists public.medicoes_auditoria (
  id           uuid primary key default gen_random_uuid(),
  indicator_id text not null,
  period       text not null,
  value_old    numeric,
  value_new    numeric not null,
  changed_by   uuid references auth.users(id),
  changed_at   timestamptz not null default now()
);

create index if not exists medicoes_auditoria_indicator_period_idx
  on public.medicoes_auditoria(indicator_id, period, changed_at desc);

-- =============================================================
-- 2. TRIGGERS
-- =============================================================

create or replace function public.medicoes_audit_trigger()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.medicoes_auditoria (indicator_id, period, value_old, value_new, changed_by)
    values (new.indicator_id, new.period, null, new.value, new.updated_by);
  elsif (tg_op = 'UPDATE') then
    if old.value is distinct from new.value then
      insert into public.medicoes_auditoria (indicator_id, period, value_old, value_new, changed_by)
      values (new.indicator_id, new.period, old.value, new.value, new.updated_by);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_medicoes_audit on public.medicoes;
create trigger trg_medicoes_audit
after insert or update on public.medicoes
for each row execute function public.medicoes_audit_trigger();

-- =============================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================

alter table public.indicadores enable row level security;
alter table public.medicoes enable row level security;
alter table public.medicoes_auditoria enable row level security;

-- Catálogo: leitura pública (autenticados); escrita só admin (via service role).
drop policy if exists "indicadores_read_authenticated" on public.indicadores;
create policy "indicadores_read_authenticated"
  on public.indicadores for select
  to authenticated
  using (true);

-- Medições: autenticados leem e escrevem (papel único na V3).
drop policy if exists "medicoes_read_authenticated" on public.medicoes;
create policy "medicoes_read_authenticated"
  on public.medicoes for select
  to authenticated
  using (true);

drop policy if exists "medicoes_insert_authenticated" on public.medicoes;
create policy "medicoes_insert_authenticated"
  on public.medicoes for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "medicoes_update_authenticated" on public.medicoes;
create policy "medicoes_update_authenticated"
  on public.medicoes for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "medicoes_delete_authenticated" on public.medicoes;
create policy "medicoes_delete_authenticated"
  on public.medicoes for delete
  to authenticated
  using (auth.uid() is not null);

-- Auditoria: autenticados leem; insert é via trigger com security definer.
drop policy if exists "auditoria_read_authenticated" on public.medicoes_auditoria;
create policy "auditoria_read_authenticated"
  on public.medicoes_auditoria for select
  to authenticated
  using (true);
