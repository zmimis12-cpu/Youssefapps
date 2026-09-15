# Connexion Supabase

L'application est déjà câblée pour synchroniser **fournisseurs** et **comptes
"donneur d'ordre"** sur ton projet Supabase (`ivgmgiykobrexcczroqn`). Les clés
sont dans `.env` à la racine du projet.

⚠️ Il manque une seule étape que je ne peux pas faire à ta place : créer les
deux tables. La clé fournie est la clé "anon" (publique, utilisée par le
navigateur) — elle ne permet pas de créer des tables, seulement de lire/écrire
des lignes une fois qu'elles existent.

## 1. Crée les tables

Dans le dashboard Supabase → **SQL Editor** → colle et exécute ceci en une fois :

```sql
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
```

Une fois exécuté, recharge l'application : elle bascule automatiquement sur
Supabase (indicateur "· synchronisé" en haut à gauche), sème les 3
fournisseurs de démo si la table est vide, et garde toujours une copie locale
(localStorage) en secours si la connexion tombe.

## 2. Ce que ça change concrètement

- Tes fournisseurs et comptes "donneur d'ordre" sont désormais accessibles
  depuis n'importe quel navigateur/ordinateur, pas seulement celui où tu as
  commencé.
- Le formulaire de virement en cours (les champs que tu remplis pour UN
  virement) reste, lui, uniquement local — le synchroniser à chaque frappe
  serait inutilement lourd.

## 3. Point de sécurité à connaître

La policy ci-dessus (`using (true) with check (true)`) autorise **quiconque
possède la clé anon** à lire et modifier ces deux tables. Cette clé est
publique par construction (elle est visible dans le code de l'application,
comme toujours avec Supabase côté navigateur) — donc en l'état, une personne
qui l'extrait du code pourrait voir ou modifier ta liste de fournisseurs et
de comptes.

Pour ce projet (données professionnelles mais pas des mots de passe), c'est
un compromis raisonnable tant que l'app reste à usage interne. Si tu veux la
verrouiller davantage, la solution propre est d'ajouter l'authentification
Supabase (email/mot de passe) et de remplacer les policies par des règles du
type `using (auth.uid() = owner_id)` — je peux le faire si tu veux, mais ça
demande d'ajouter un écran de connexion à l'app.
