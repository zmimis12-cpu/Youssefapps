import { useMemo, useState } from 'react';
import type { ArchivedDocument, OwnAccount } from '../types';
import { formatAmountDigits } from '../utils/formatAmount';
import { writtenLabelFor } from '../data/currencies';

interface Props {
  history: ArchivedDocument[];
  ownAccounts: OwnAccount[];
  onExportPdf: (doc: ArchivedDocument) => void;
  onTogglePaid: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

type PaidFilter = 'all' | 'paid' | 'unpaid';

export default function HistoryModal({
  history,
  ownAccounts,
  onExportPdf,
  onTogglePaid,
  onDelete,
  onClose,
}: Props) {
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [paidFilter, setPaidFilter] = useState<PaidFilter>('all');

  const accountName = (id: string | null) => {
    if (!id) return 'Sans compte associé';
    return ownAccounts.find((a) => a.id === id)?.name || 'Compte supprimé';
  };

  const filtered = useMemo(() => {
    return [...history]
      .filter((d) => accountFilter === 'all' || (d.form.ownAccountId ?? 'none') === accountFilter)
      .filter((d) => paidFilter === 'all' || (paidFilter === 'paid' ? d.paid : !d.paid))
      .sort((a, b) => b.printedAt - a.printedAt);
  }, [history, accountFilter, paidFilter]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl border border-ink-100">
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

        <div className="px-5 py-3 border-b border-ink-100 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-ink-500 mr-1">Compte :</span>
            <FilterPill active={accountFilter === 'all'} onClick={() => setAccountFilter('all')}>
              Tous
            </FilterPill>
            {ownAccounts.map((a) => (
              <FilterPill key={a.id} active={accountFilter === a.id} onClick={() => setAccountFilter(a.id)}>
                {a.name || 'Sans nom'}
              </FilterPill>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-ink-500 mr-1">Statut :</span>
            <FilterPill active={paidFilter === 'all'} onClick={() => setPaidFilter('all')}>
              Tous
            </FilterPill>
            <FilterPill active={paidFilter === 'paid'} onClick={() => setPaidFilter('paid')}>
              Payé
            </FilterPill>
            <FilterPill active={paidFilter === 'unpaid'} onClick={() => setPaidFilter('unpaid')}>
              Non payé
            </FilterPill>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">Aucun document pour ce filtre.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {filtered.map((doc) => {
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
                        {' · '}
                        {accountName(f.ownAccountId)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => onTogglePaid(doc.id)}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          doc.paid
                            ? 'bg-teal-100 text-teal-700 border border-teal-600'
                            : 'bg-ink-100 text-ink-700 border border-ink-300'
                        }`}
                      >
                        {doc.paid ? '✓ Payé' : 'Non payé'}
                      </button>
                      <button
                        onClick={() => onExportPdf(doc)}
                        className="rounded-md border border-ink-300 px-2.5 py-1.5 text-xs font-medium text-ink-800 hover:bg-ink-100 transition-colors"
                      >
                        📄 PDF
                      </button>
                      <button
                        title="Supprimer de l'historique"
                        onClick={() => {
                          if (confirm("Retirer ce document de l'historique ?")) onDelete(doc.id);
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

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active ? 'bg-teal-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-100/70'
      }`}
    >
      {children}
    </button>
  );
}
