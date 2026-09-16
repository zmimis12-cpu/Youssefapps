-- A copier-coller tel quel dans Supabase -> SQL Editor -> New query -> Run.
-- Aucun caractere a retirer, ce fichier ne contient que du SQL.
-- Peut etre relance sans risque meme si une partie a deja ete executee.

create table if not exists suppliers (
  id text primary key,
  name text not null default '',
  address text not null default '',
  city text not null default '',
  country text not null default '',
  account_number text not null default '',
  bank_name text not null default '',
  swift text default '',
  notes text default '',
  updated_at timestamptz default now()
);

create table if not exists own_accounts (
  id text primary key,
  name text not null default '',
  account_number text not null default '',
  updated_at timestamptz default now()
);

create table if not exists transfer_history (
  id text primary key,
  printed_at timestamptz not null default now(),
  form jsonb not null
);

alter table suppliers enable row level security;
alter table own_accounts enable row level security;
alter table transfer_history enable row level security;

drop policy if exists "anon full access" on suppliers;
create policy "anon full access" on suppliers
  for all using (true) with check (true);

drop policy if exists "anon full access" on own_accounts;
create policy "anon full access" on own_accounts
  for all using (true) with check (true);

drop policy if exists "anon full access" on transfer_history;
create policy "anon full access" on transfer_history
  for all using (true) with check (true);

grant select, insert, update, delete on table suppliers to anon, authenticated;
grant select, insert, update, delete on table own_accounts to anon, authenticated;
grant select, insert, update, delete on table transfer_history to anon, authenticated;
