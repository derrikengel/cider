-- Single shared "current recipe" state for the bourbon cider calculator.
-- One row only (id is pinned to 1) — this isn't a collection, it's the
-- current state of the calculator. Run this once in the Supabase SQL editor.

create table if not exists public.recipe_state (
  id smallint primary key default 1,
  planning_mode text not null default 'servings' check (planning_mode in ('servings', 'cider')),
  servings_target numeric not null default 150,
  cider_gallons numeric not null default 8,
  bourbon_cups_per_gallon numeric not null default 1.5,
  serving_oz numeric not null default 8,
  batch_size_gal numeric not null default 1,
  overrides jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint recipe_state_singleton check (id = 1)
);

alter table public.recipe_state enable row level security;

-- No user accounts (see BRIEF.md) — this is a low-stakes shared cider
-- recipe, not sensitive data, so the anon key is allowed to read/write the
-- single row directly. Keep this table scoped to exactly this purpose.
create policy "anon can read recipe_state" on public.recipe_state
  for select to anon using (true);

create policy "anon can update recipe_state" on public.recipe_state
  for update to anon using (id = 1) with check (id = 1);

create policy "anon can insert the singleton row" on public.recipe_state
  for insert to anon with check (id = 1);
