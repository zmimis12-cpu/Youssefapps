import type { Supplier, TransferForm, OwnAccount } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const SUPPLIERS_KEY = 'virement.suppliers.v1';
const CURRENT_FORM_KEY = 'virement.currentForm.v1';
const OWN_ACCOUNTS_KEY = 'virement.ownAccounts.v1';

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

export { isSupabaseConfigured };
