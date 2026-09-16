import type { ArchivedDocument } from '../types';
import { formatAmountDigits } from '../utils/formatAmount';
import { writtenLabelFor } from '../data/currencies';

interface Props {
  history: ArchivedDocument[];
  onLoad: (doc: ArchivedDocument) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function HistoryModal({ history, onLoad, onDelete, onClose }: Props) {
  const sorted = [...history].sort((a, b) => b.printedAt - a.printedAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl border border-ink-100">
        <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">Documents imprimés / exportés</h3>
            <p className="mt-0.5 text-xs text-ink-500">
              Chaque impression ou export PDF est enregistré ici automatiquement.
            </p>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 text-lg leading-none px-1">
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {sorted.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">
              Aucun document imprimé pour l'instant.
            </p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {sorted.map((doc) => {
                const f = doc.form;
                const amount = f.amount ? formatAmountDigits(f.amount) : '';
                const currencyLabel = f.currency ? writtenLabelFor(f.currency) : '';
                const dt = new Date(doc.printedAt);
                return (
                  <li key={doc.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {f.beneficiaryName || 'Bénéficiaire non renseigné'}
                      </p>
                      <p className="text-xs text-ink-500">
                        {dt.toLocaleDateString('fr-FR')} à{' '}
                        {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {amount && (
                          <>
                            {' '}
                            · {amount} {currencyLabel}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        onClick={() => onLoad(doc)}
                        className="rounded-md border border-teal-600 px-2.5 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
                      >
                        Réimprimer
                      </button>
                      <button
                        title="Supprimer de l'historique"
                        onClick={() => {
                          if (confirm('Retirer ce document de l\'historique ?')) onDelete(doc.id);
                        }}
                        className="rounded-md border border-ink-300 p-1.5 text-ink-500 hover:bg-ink-100 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
