import type { Supplier, TransferForm, OwnAccount } from '../types';

const SUPPLIERS_KEY = 'virement.suppliers.v1';
const CURRENT_FORM_KEY = 'virement.currentForm.v1';
const OWN_ACCOUNTS_KEY = 'virement.ownAccounts.v1';

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
