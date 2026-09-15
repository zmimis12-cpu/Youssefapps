import type { Supplier, TransferForm } from '../types';

const SUPPLIERS_KEY = 'virement.suppliers.v1';
const CURRENT_FORM_KEY = 'virement.currentForm.v1';

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
