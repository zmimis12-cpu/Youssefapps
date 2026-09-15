# Virements fournisseurs — préparation interne

Application web pour préparer vos ordres de virement à l'étranger (fournisseurs Chine, etc.)
sans les remplir à la main. Interface : fournisseurs à gauche, aperçu A4 à droite.

⚠️ Cet outil ne génère aucun document officiel. Il ne reproduit ni cachet bancaire, ni
signature manuscrite, ni validation de l'agence — chaque page porte la mention
« COPIE / PRÉPARATION INTERNE » et le "Cadre réservé à l'agence" reste vierge.
Le document final doit toujours être signé et déposé physiquement à l'agence.

## Démarrer en local

```bash
npm install
npm run dev
```
Ouvre ensuite http://localhost:5173

## Build de production

```bash
npm run build
npm run preview   # pour tester le build localement
```
Le résultat est généré dans `dist/`.

## Fonctionnalités

- **Fournisseurs** (sidebar gauche) : ajouter / modifier / supprimer / rechercher,
  sauvegardés automatiquement dans le navigateur (localStorage). 3 fournisseurs
  fictifs sont préchargés à la première ouverture.
- **Mon compte (donneur d'ordre)** : dans la section "Donneur d'ordre" du
  formulaire, enregistre ton/tes propre(s) nom(s)/raison(s) sociale(s) et numéro(s)
  de compte (bouton "+"). Une fois enregistrés, sélectionne-les depuis le menu
  déroulant pour préremplir automatiquement le formulaire — modifiable et
  supprimable à tout moment (✎ / ✕), sauvegardés en localStorage.
- **Sélection fournisseur → formulaire** : cliquer sur un fournisseur remplit
  automatiquement les champs bénéficiaire.
- **Montant → lettres automatique, toutes devises** : tape un montant (ex:
  27302.50) et choisis une devise dans le sélecteur avec recherche (par code ISO,
  nom ou pays — ex. "yen", "JPY", "livre", "dirham"...) parmi ~160 devises du monde
  → le montant en chiffres ET en lettres françaises s'affichent instantanément.
  Les devises les plus courantes (MAD, USD, EUR, GBP, CNY, CHF, etc.) ont un nom
  français précis et un pluriel correct ; les autres utilisent le nom dérivé
  automatiquement de la liste ISO 4217.
- **Aperçu A4 en temps réel** : toute modification à gauche se répercute immédiatement
  sur le document à droite, positionné aux bonnes coordonnées.
- **Impression** : bouton "🖨 Imprimer A4" → n'imprime que la feuille A4 (sidebar et
  boutons masqués), format A4 exact, marges à 0.
- **Export PDF** : bouton "📄 Export PDF" → génère un PDF A4 téléchargeable directement
  dans le navigateur, sans serveur.
- **Nouveau / Dupliquer / Réinitialiser** : gestion rapide de plusieurs virements à la
  suite. Le dernier formulaire utilisé est automatiquement sauvegardé.
- **Validation** : compte bénéficiaire, bénéficiaire, banque, pays, ville, devise et
  montant (> 0) sont obligatoires avant impression ou export.
- **Responsive** : sur petit écran, la sidebar devient un tiroir (☰ en haut à gauche),
  formulaire et aperçu s'empilent verticalement.

## Ajuster la position des champs sur le document A4

Tous les champs variables (bénéficiaire, montant, dates, etc.) sont positionnés par
coordonnées dans :

```
src/config/fieldsConfig.ts
```

Chaque champ a un `x`, `y` (en millimètres, sur une feuille de 210×297mm), une `width`
et une `fontSize`. Modifier ces valeurs ajuste immédiatement la position sur l'aperçu
et sur l'impression — aucun autre fichier à toucher pour un simple réglage de position.

Les éléments fixes du formulaire (barres de titre, cases à cocher, libellés, lignes)
sont dans `src/components/A4Preview.tsx`.

## Base de données (Supabase)

Voir [`SUPABASE.md`](./SUPABASE.md) — une seule étape manuelle (créer 2 tables
via le SQL Editor de Supabase) suffit pour synchroniser fournisseurs et
comptes "donneur d'ordre" entre appareils. Sans cette étape, tout continue de
fonctionner en localStorage uniquement.

## Architecture

```
src/
 ├── components/
 │    ├── Sidebar.tsx          — panneau fournisseurs
 │    ├── SupplierList.tsx     — liste + recherche + actions
 │    ├── SupplierForm.tsx     — modale d'ajout/modification fournisseur
 │    ├── TransferForm.tsx     — formulaire de saisie du virement
 │    ├── A4Preview.tsx        — reproduction structurelle du document + données
 │    ├── AmountToWords.tsx    — aperçu "montant en lettres" dans le formulaire
 │    └── PrintButton.tsx      — bouton d'impression
 │
 ├── config/
 │    └── fieldsConfig.ts      — coordonnées (x, y, width, fontSize) des champs A4
 │
 ├── data/
 │    └── suppliers.ts         — fournisseurs de démonstration (données fictives)
 │
 ├── utils/
 │    ├── amountToWords.ts     — conversion montant → texte français (multi-devises)
 │    ├── formatAmount.ts      — formatage des montants en chiffres
 │    └── storage.ts           — persistance localStorage
 │
 ├── types/
 │    └── index.ts             — types Supplier, TransferForm, etc.
 │
 └── App.tsx                   — assemblage de l'interface
```

Stack : React 19 + TypeScript + Vite + Tailwind CSS v4. Aucun backend requis ; prêt à
brancher Supabase plus tard (remplacer `src/utils/storage.ts` par des appels API tout
en gardant la même interface `loadSuppliers/saveSuppliers/loadCurrentForm/saveCurrentForm`).
