import { useEffect, useState } from 'react';
import type { OwnAccount } from '../types';

interface Props {
  initial: OwnAccount | null;
  onSave: (a: OwnAccount) => void;
  onCancel: () => void;
}

const empty = (): OwnAccount => ({
  id: crypto.randomUUID(),
  name: '',
  accountNumber: '',
});

export default function OwnAccountForm({ initial, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<OwnAccount>(initial ?? empty());

  useEffect(() => {
    setDraft(initial ?? empty());
  }, [initial]);

  const valid = draft.name.trim() && draft.accountNumber.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white shadow-xl border border-ink-100">
        <div className="px-5 py-4 border-b border-ink-100">
          <h3 className="text-sm font-semibold text-ink-900">
            {initial ? 'Modifier mon compte' : 'Ajouter mon compte'}
          </h3>
          <p className="mt-0.5 text-xs text-ink-500">
            Utilisé comme donneur d'ordre par défaut sur le formulaire.
          </p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-ink-500">Nom / raison sociale</span>
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="mt-1 w-full rounded-md border border-ink-300 px-2.5 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
              autoFocus
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-ink-500">
              Compte N° <span className="text-red-500">*</span>
            </span>
            <input
              value={draft.accountNumber}
              onChange={(e) => setDraft((d) => ({ ...d, accountNumber: e.target.value }))}
              className="mt-1 w-full rounded-md border border-ink-300 px-2.5 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
            />
          </label>
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
