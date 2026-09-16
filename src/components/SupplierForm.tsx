import { useEffect, useState } from 'react';
import type { Supplier } from '../types';

interface Props {
  initial: Supplier | null;
  onSave: (s: Supplier) => void;
  onCancel: () => void;
}

const empty = (): Supplier => ({
  id: crypto.randomUUID(),
  name: '',
  address: '',
  city: '',
  country: '',
  accountNumber: '',
  bankName: '',
  swift: '',
  notes: '',
});

export default function SupplierForm({ initial, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Supplier>(initial ?? empty());

  useEffect(() => {
    setDraft(initial ?? empty());
  }, [initial]);

  const set = <K extends keyof Supplier>(key: K, value: Supplier[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const valid = draft.name.trim() && draft.country.trim() && draft.accountNumber.trim() && draft.bankName.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl border border-ink-100">
        <div className="px-5 py-4 border-b border-ink-100">
          <h3 className="text-sm font-semibold text-ink-900">
            {initial ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </h3>
        </div>
        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <Field label="Nom / raison sociale" value={draft.name} onChange={(v) => set('name', v)} required />
          <Field label="Adresse" value={draft.address} onChange={(v) => set('address', v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ville" value={draft.city} onChange={(v) => set('city', v)} />
            <Field label="Pays" value={draft.country} onChange={(v) => set('country', v)} required />
          </div>
          <Field
            label="Numéro de compte bénéficiaire"
            value={draft.accountNumber}
            onChange={(v) => set('accountNumber', v)}
            required
          />
          <Field label="Banque bénéficiaire" value={draft.bankName} onChange={(v) => set('bankName', v)} required />
          <Field label="SWIFT / BIC (optionnel)" value={draft.swift ?? ''} onChange={(v) => set('swift', v)} />
          <Field label="Notes (optionnel)" value={draft.notes ?? ''} onChange={(v) => set('notes', v)} />
        </div>
        <div className="px-5 py-4 border-t border-ink-100 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm rounded-md text-ink-700 hover:bg-ink-100 transition-colors"
          >
            Annuler
          </button>
          <button
            disabled={!valid}
            onClick={() => onSave(draft)}
            className="px-3 py-1.5 text-sm rounded-md bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-500">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-ink-300 px-2.5 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
      />
    </label>
  );
}
