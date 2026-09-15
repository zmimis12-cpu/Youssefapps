import type { Supplier } from '../types';

interface Props {
  suppliers: Supplier[];
  query: string;
  selectedId: string | null;
  onSelect: (s: Supplier) => void;
  onEdit: (s: Supplier) => void;
  onDelete: (id: string) => void;
}

export default function SupplierList({ suppliers, query, selectedId, onSelect, onEdit, onDelete }: Props) {
  const filtered = suppliers.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.country.toLowerCase().includes(q) ||
      s.bankName.toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    return <p className="px-1 py-6 text-center text-xs text-ink-500">Aucun fournisseur trouvé.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {filtered.map((s) => {
        const active = s.id === selectedId;
        return (
          <li key={s.id}>
            <div
              onClick={() => onSelect(s)}
              className={`group cursor-pointer rounded-md border px-3 py-2 transition-colors ${
                active
                  ? 'border-teal-500 bg-teal-100/60'
                  : 'border-transparent hover:border-ink-100 hover:bg-ink-100/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{s.name}</p>
                  <p className="truncate text-xs text-ink-500">{s.country || '—'} · {s.bankName || '—'}</p>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    title="Modifier"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(s);
                    }}
                    className="rounded p-1 text-ink-500 hover:bg-white hover:text-ink-900"
                  >
                    ✎
                  </button>
                  <button
                    title="Supprimer"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Supprimer "${s.name}" ?`)) onDelete(s.id);
                    }}
                    className="rounded p-1 text-ink-500 hover:bg-white hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
