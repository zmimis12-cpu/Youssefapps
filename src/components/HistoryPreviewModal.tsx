import { useEffect, useRef, useState } from 'react';
import type { ArchivedDocument, OwnAccount, TransferForm } from '../types';
import A4Preview from './A4Preview';
import TransferFormFields from './TransferForm';

interface Props {
  doc: ArchivedDocument;
  ownAccounts: OwnAccount[];
  onClose: () => void;
  onSave: (updatedForm: TransferForm) => void;
  onAddOwnAccount: () => void;
  onEditOwnAccount: (a: OwnAccount) => void;
  onDeleteOwnAccount: (id: string) => void;
  onExportPdf: (doc: ArchivedDocument) => void;
}

export default function HistoryPreviewModal({
  doc,
  ownAccounts,
  onClose,
  onSave,
  onAddOwnAccount,
  onEditOwnAccount,
  onDeleteOwnAccount,
  onExportPdf,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<TransferForm>(doc.form);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Repart d'une copie propre du document à chaque ouverture / changement de
  // document, pour ne jamais mélanger les brouillons de deux documents.
  useEffect(() => {
    setDraft(doc.form);
    setEditMode(false);
  }, [doc]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const A4_WIDTH_MM = 210;
    const PX_PER_MM = 96 / 25.4;
    const compute = () => {
      const available = el.clientWidth - 24;
      const natural = A4_WIDTH_MM * PX_PER_MM;
      setScale(Math.min(1, available / natural));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [editMode]);

  const setField = <K extends keyof TransferForm>(key: K, value: TransferForm[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const selectOwnAccountForDraft = (a: OwnAccount) => {
    setDraft((d) => ({ ...d, ownAccountId: a.id, orderName: a.name, orderAccountNumber: a.accountNumber }));
  };

  const handleSave = () => {
    onSave(draft);
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setDraft(doc.form);
    setEditMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 px-4 py-6">
      <div className="flex h-full w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl border border-ink-100">
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-100 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">
              {doc.form.invoiceRef || doc.form.beneficiaryName || 'Document'}
            </h3>
            <p className="text-xs text-ink-500">
              {editMode
                ? 'Modification — clique "Sauvegarder" pour appliquer les changements à ce document.'
                : 'Aperçu du document archivé'}
            </p>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 text-lg leading-none px-1">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {editMode && (
            <div className="w-full md:w-[420px] shrink-0 overflow-y-auto border-r border-ink-100 px-5 py-4">
              <TransferFormFields
                form={draft}
                onChange={setField}
                errors={{}}
                ownAccounts={ownAccounts}
                onSelectOwnAccount={selectOwnAccountForDraft}
                onAddOwnAccount={onAddOwnAccount}
                onEditOwnAccount={onEditOwnAccount}
                onDeleteOwnAccount={onDeleteOwnAccount}
              />
            </div>
          )}
          <div ref={wrapRef} className="flex-1 overflow-auto bg-ink-100 px-3 py-4">
            <div className="flex justify-center">
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
                <A4Preview form={editMode ? draft : doc.form} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-3 border-t border-ink-100 shrink-0">
          {editMode ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="rounded-md px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
              >
                💾 Sauvegarder
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-100 transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => onExportPdf(doc)}
                className="rounded-md border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-800 hover:bg-ink-100 transition-colors"
              >
                📄 Télécharger PDF
              </button>
              <button
                onClick={() => setEditMode(true)}
                className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
              >
                ✏️ Modifier
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
