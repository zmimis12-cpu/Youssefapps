import type { Supplier, TransferForm, OwnAccount, ArchivedDocument } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const SUPPLIERS_KEY = 'virement.suppliers.v1';
const CURRENT_FORM_KEY = 'virement.currentForm.v1';
const OWN_ACCOUNTS_KEY = 'virement.ownAccounts.v1';
const SUPPLIERS_SEEDED_KEY = 'virement.suppliersSeeded.v1';
const HISTORY_KEY = 'virement.history.v1';

// Distingue "jamais utilisé" (on peut semer les 3 fournisseurs de démo) de
// "l'utilisateur a tout supprimé" (une liste vide qu'il faut respecter).
// Sans ça, supprimer tous les fournisseurs puis recharger la page les fait
// réapparaître, puisqu'une liste vide ressemblait à un premier lancement.
export function haveSuppliersBeenSeeded(): boolean {
  return localStorage.getItem(SUPPLIERS_SEEDED_KEY) === '1';
}

export function markSuppliersSeeded() {
  localStorage.setItem(SUPPLIERS_SEEDED_KEY, '1');
}

// ---- Cache locale (localStorage) — toujours utilisée pour un chargement
// instantané et comme filet de secours si Supabase est indisponible. ----

export function loadSuppliers(): Supplier[] {
  try {
    const raw = localStorage.getItem(SUPPLIERS_KEY);
    return raw ? (JSON.parse(raw) as Supplier[]) : [];
  } catch {
    return [];
  }
}

export function saveSuppliers(suppliers: Supplier[]) {
  localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
}

export function loadOwnAccounts(): OwnAccount[] {
  try {
    const raw = localStorage.getItem(OWN_ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as OwnAccount[]) : [];
  } catch {
    return [];
  }
}

export function saveOwnAccounts(accounts: OwnAccount[]) {
  localStorage.setItem(OWN_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function loadCurrentForm(): TransferForm | null {
  try {
    const raw = localStorage.getItem(CURRENT_FORM_KEY);
    return raw ? (JSON.parse(raw) as TransferForm) : null;
  } catch {
    return null;
  }
}

export function saveCurrentForm(form: TransferForm) {
  localStorage.setItem(CURRENT_FORM_KEY, JSON.stringify(form));
}

export function loadHistory(): ArchivedDocument[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ArchivedDocument[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history: ArchivedDocument[]) {
  // Garde les 200 documents les plus récents pour éviter que la cache locale
  // ne grossisse indéfiniment.
  const trimmed = [...history].sort((a, b) => b.printedAt - a.printedAt).slice(0, 200);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

// ---- Supabase (optionnel) — synchronise fournisseurs et comptes "donneur
// d'ordre" sur une base partagée, pour les retrouver sur un autre appareil.
// Le formulaire en cours (frappe à chaque caractère) reste local uniquement :
// le synchroniser en direct ferait trop d'appels réseau. ----

type SupplierRow = {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  account_number: string;
  bank_name: string;
  swift: string | null;
  notes: string | null;
};

function supplierFromRow(r: SupplierRow): Supplier {
  return {
    id: r.id,
    name: r.name,
    address: r.address,
    city: r.city,
    country: r.country,
    accountNumber: r.account_number,
    bankName: r.bank_name,
    swift: r.swift ?? '',
    notes: r.notes ?? '',
  };
}

function supplierToRow(s: Supplier) {
  return {
    id: s.id,
    name: s.name,
    address: s.address,
    city: s.city,
    country: s.country,
    account_number: s.accountNumber,
    bank_name: s.bankName,
    swift: s.swift ?? '',
    notes: s.notes ?? '',
  };
}

export async function fetchSuppliersFromSupabase(): Promise<Supplier[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('suppliers').select('*').order('name');
  if (error) {
    console.warn('Supabase (suppliers) indisponible, utilisation du stockage local :', error.message);
    return null;
  }
  return (data as SupplierRow[]).map(supplierFromRow);
}

export async function upsertSupplierToSupabase(s: Supplier): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('suppliers').upsert(supplierToRow(s));
  if (error) console.warn('Supabase (suppliers) — échec de la sauvegarde distante :', error.message);
}

export async function deleteSupplierFromSupabase(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) console.warn('Supabase (suppliers) — échec de la suppression distante :', error.message);
}

type OwnAccountRow = { id: string; name: string; account_number: string };

export async function fetchOwnAccountsFromSupabase(): Promise<OwnAccount[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('own_accounts').select('*').order('name');
  if (error) {
    console.warn('Supabase (own_accounts) indisponible, utilisation du stockage local :', error.message);
    return null;
  }
  return (data as OwnAccountRow[]).map((r) => ({ id: r.id, name: r.name, accountNumber: r.account_number }));
}

export async function upsertOwnAccountToSupabase(a: OwnAccount): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('own_accounts')
    .upsert({ id: a.id, name: a.name, account_number: a.accountNumber });
  if (error) console.warn('Supabase (own_accounts) — échec de la sauvegarde distante :', error.message);
}

export async function deleteOwnAccountFromSupabase(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('own_accounts').delete().eq('id', id);
  if (error) console.warn('Supabase (own_accounts) — échec de la suppression distante :', error.message);
}

// ---- Historique des documents imprimés/exportés — un instantané complet du
// formulaire à cet instant, pour pouvoir le retrouver et le réimprimer plus
// tard, même après avoir perdu le papier. ----

type HistoryRow = { id: string; printed_at: string; form: TransferForm };

export async function fetchHistoryFromSupabase(): Promise<ArchivedDocument[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('transfer_history')
    .select('*')
    .order('printed_at', { ascending: false })
    .limit(200);
  if (error) {
    console.warn('Supabase (transfer_history) indisponible, utilisation du stockage local :', error.message);
    return null;
  }
  return (data as HistoryRow[]).map((r) => ({
    id: r.id,
    printedAt: new Date(r.printed_at).getTime(),
    form: r.form,
  }));
}

export async function upsertHistoryToSupabase(doc: ArchivedDocument): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('transfer_history')
    .upsert({ id: doc.id, printed_at: new Date(doc.printedAt).toISOString(), form: doc.form });
  if (error) console.warn('Supabase (transfer_history) — échec de la sauvegarde distante :', error.message);
}

export async function deleteHistoryFromSupabase(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('transfer_history').delete().eq('id', id);
  if (error) console.warn('Supabase (transfer_history) — échec de la suppression distante :', error.message);
}

export { isSupabaseConfigured };
