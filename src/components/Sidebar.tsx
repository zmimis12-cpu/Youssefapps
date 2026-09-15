import type { Supplier } from '../types';
import SupplierList from './SupplierList';

interface Props {
  suppliers: Supplier[];
  query: string;
  setQuery: (q: string) => void;
  selectedId: string | null;
  onSelect: (s: Supplier) => void;
  onEdit: (s: Supplier) => void;
  onDelete: (id: string) => void;
  onAddNew: () => void;
}

export default function Sidebar({
  suppliers,
  query,
  setQuery,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
}: Props) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-ink-100 bg-white">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Fournisseurs</h2>
        <div className="mt-3 relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="w-full rounded-md border border-ink-300 bg-ink-50 px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
          />
        </div>
        <button
          onClick={onAddNew}
          className="mt-3 w-full rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          + Nouveau fournisseur
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <SupplierList
          suppliers={suppliers}
          query={query}
          selectedId={selectedId}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
      <div className="px-4 py-3 border-t border-ink-100 text-[11px] text-ink-500">
        {suppliers.length} fournisseur{suppliers.length > 1 ? 's' : ''} enregistré{suppliers.length > 1 ? 's' : ''}
      </div>
    </aside>
  );
}
