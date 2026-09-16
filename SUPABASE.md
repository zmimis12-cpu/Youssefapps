# Connexion Supabase

L'application est déjà câblée pour synchroniser **fournisseurs** et **comptes
"donneur d'ordre"** sur ton projet Supabase (`ivgmgiykobrexcczroqn`). Les clés
sont dans `.env` à la racine du projet.

⚠️ Il manque une seule étape que je ne peux pas faire à ta place : créer les
deux tables. La clé fournie est la clé "anon" (publique, utilisée par le
navigateur) — elle ne permet pas de créer des tables, seulement de lire/écrire
des lignes une fois qu'elles existent. Tant que ce n'est pas fait, l'app
continue de fonctionner normalement en local (les erreurs 404 / "table not
found" que tu vois dans la console sont attendues, sans conséquence).

## 1. Crée les tables

**Le plus simple** : ouvre le fichier `supabase_setup.sql` (à la racine du
projet, à côté de ce fichier) — il ne contient que du SQL, rien d'autre à
retirer. Sélectionne tout (Ctrl+A / Cmd+A), copie, colle dans Supabase →
**SQL Editor** → **New query**, puis clique **Run**.

Sinon, voici le même contenu ici — colle **uniquement le SQL, sans les trois
lignes de ``` qui l'entourent dans ce document** (ce sont des marqueurs
Markdown, pas du SQL — s'ils sont collés dans l'éditeur, tu obtiens l'erreur
"syntax error at or near ```") :

```
-- DÉBUT
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
-- FIN
```

Une fois exécuté sans erreur, recharge l'application : elle bascule
automatiquement sur Supabase (indicateur "· synchronisé" en haut à gauche),
sème les 3 fournisseurs de démo si la table est vide, et garde toujours une
copie locale (localStorage) en secours si la connexion tombe.

**Vérifier que ça a marché** : dans le dashboard Supabase → **Table Editor**,
tu dois voir apparaître `suppliers` et `own_accounts` dans la liste des
tables à gauche. Si l'erreur persiste, vérifie qu'il ne reste aucun caractère
` (accent grave / backtick) au tout début ou à la toute fin de ce que tu as
collé — c'est la cause la plus fréquente de ce message d'erreur précis.

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
