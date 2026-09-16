-- A copier-coller tel quel dans Supabase → SQL Editor → New query → Run.
-- Aucun caractère à retirer, ce fichier ne contient que du SQL.

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

alter table suppliers enable row level security;
alter table own_accounts enable row level security;

create policy "anon full access" on suppliers
  for all using (true) with check (true);

create policy "anon full access" on own_accounts
  for all using (true) with check (true);
