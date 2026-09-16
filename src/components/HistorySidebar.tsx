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
}

type PaidFilter = 'all' | 'paid' | 'unpaid';
const NO_ACCOUNT = '__none__';

export default function HistorySidebar({ history, ownAccounts, onExportPdf, onTogglePaid, onDelete }: Props) {
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [paidFilter, setPaidFilter] = useState<PaidFilter>('all');

  const filtered = useMemo(() => {
    return history
      .filter(
        (d) =>
          accountFilter === 'all' || (d.form.ownAccountId ?? NO_ACCOUNT) === accountFilter
      )
      .filter((d) => paidFilter === 'all' || (paidFilter === 'paid' ? d.paid : !d.paid));
  }, [history, accountFilter, paidFilter]);

  // Classement : un groupe par compte donneur d'ordre (dans l'ordre des
  // comptes enregistrés, puis "Sans compte associé"), documents les plus
  // récents en premier dans chaque groupe.
  const groups = useMemo(() => {
    const byAccount = new Map<string, ArchivedDocument[]>();
    for (const doc of filtered) {
      const key = doc.form.ownAccountId ?? NO_ACCOUNT;
      const list = byAccount.get(key) ?? [];
      list.push(doc);
      byAccount.set(key, list);
    }
    for (const list of byAccount.values()) {
      list.sort((a, b) => b.printedAt - a.printedAt);
    }
    const orderedKeys = [...ownAccounts.map((a) => a.id), NO_ACCOUNT].filter((k) => byAccount.has(k));
    return orderedKeys.map((key) => ({
      key,
      label:
        key === NO_ACCOUNT ? 'Sans compte associé' : ownAccounts.find((a) => a.id === key)?.name || 'Compte supprimé',
      docs: byAccount.get(key)!,
    }));
  }, [filtered, ownAccounts]);

  return (
    <aside className="flex h-full w-full flex-col border-r border-ink-100 bg-white">
      <div className="px-4 pt-5 pb-3 space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Historique</h2>

        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="w-full rounded-md border border-ink-300 bg-ink-50 px-2.5 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
        >
          <option value="all">Tous les comptes</option>
          {ownAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name || 'Sans nom'}
            </option>
          ))}
        </select>

        <div className="flex gap-1.5">
          {(['all', 'unpaid', 'paid'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setPaidFilter(v)}
              className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                paidFilter === v ? 'bg-teal-600 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-100/70'
              }`}
            >
              {v === 'all' ? 'Tous' : v === 'paid' ? 'Payé' : 'Non payé'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.length === 0 ? (
          <p className="px-1 py-6 text-center text-xs text-ink-500">Aucun document pour ce filtre.</p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.key}>
                <p className="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                  {group.label}{' '}
                  <span className="font-normal normal-case text-ink-500/70">({group.docs.length})</span>
                </p>
                <ul className="space-y-1.5">
                  {group.docs.map((doc) => {
                    const f = doc.form;
                    const amount = f.amount ? formatAmountDigits(f.amount) : '';
                    const currencyLabel = f.currency ? writtenLabelFor(f.currency) : '';
                    const dt = new Date(doc.printedAt);
                    return (
                      <li key={doc.id} className="rounded-md border border-ink-100 p-2.5">
                        <p className="text-sm font-medium text-ink-900 truncate">
                          {f.beneficiaryName || 'Bénéficiaire non renseigné'}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-500">
                          {dt.toLocaleDateString('fr-FR')} ·{' '}
                          {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {amount && (
                            <>
                              <br />
                              {amount} {currencyLabel}
                            </>
                          )}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <button
                            onClick={() => onTogglePaid(doc.id)}
                            className={`flex-1 rounded px-1.5 py-1 text-[11px] font-medium transition-colors ${
                              doc.paid
                                ? 'bg-teal-100 text-teal-700 border border-teal-600'
                                : 'bg-ink-100 text-ink-700 border border-ink-300'
                            }`}
                          >
                            {doc.paid ? '✓ Payé' : 'Non payé'}
                          </button>
                          <button
                            title="Télécharger le PDF"
                            onClick={() => onExportPdf(doc)}
                            className="rounded border border-ink-300 px-1.5 py-1 text-[11px] text-ink-700 hover:bg-ink-100"
                          >
                            📄
                          </button>
                          <button
                            title="Supprimer de l'historique"
                            onClick={() => {
                              if (confirm("Retirer ce document de l'historique ?")) onDelete(doc.id);
                            }}
                            className="rounded border border-ink-300 px-1.5 py-1 text-[11px] text-ink-500 hover:bg-ink-100 hover:text-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
