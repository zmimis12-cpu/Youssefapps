import type { OwnAccount } from '../types';

interface Props {
  accounts: OwnAccount[];
  selectedId: string | null;
  onSelect: (a: OwnAccount) => void;
  onAddNew: () => void;
  onEdit: (a: OwnAccount) => void;
  onDelete: (id: string) => void;
}

export default function OwnAccountPicker({ accounts, selectedId, onSelect, onAddNew, onEdit, onDelete }: Props) {
  const selected = accounts.find((a) => a.id === selectedId) ?? null;

  return (
    <div>
      <span className="text-xs font-medium text-ink-500">Mon compte (donneur d'ordre)</span>
      <div className="mt-1 flex items-center gap-1.5">
        <select
          value={selectedId ?? ''}
          onChange={(e) => {
            const acc = accounts.find((a) => a.id === e.target.value);
            if (acc) onSelect(acc);
          }}
          className="flex-1 min-w-0 rounded-md border border-ink-300 px-2.5 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
        >
          <option value="" disabled>
            {accounts.length ? 'Choisir un compte…' : 'Aucun compte enregistré'}
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name || 'Sans nom'} — {a.accountNumber}
            </option>
          ))}
        </select>
        {selected && (
          <>
            <button
              type="button"
              title="Modifier ce compte"
              onClick={() => onEdit(selected)}
              className="shrink-0 rounded-md border border-ink-300 p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
            >
              ✎
            </button>
            <button
              type="button"
              title="Supprimer ce compte"
              onClick={() => {
                if (confirm(`Supprimer "${selected.name}" ?`)) onDelete(selected.id);
              }}
              className="shrink-0 rounded-md border border-ink-300 p-1.5 text-ink-500 hover:bg-ink-100 hover:text-red-600"
            >
              ✕
            </button>
          </>
        )}
        <button
          type="button"
          title="Ajouter un nouveau compte"
          onClick={onAddNew}
          className="shrink-0 rounded-md bg-teal-600 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
