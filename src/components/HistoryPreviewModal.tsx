import { useEffect, useRef, useState } from 'react';
import type { ArchivedDocument } from '../types';
import A4Preview from './A4Preview';

interface Props {
  doc: ArchivedDocument;
  onClose: () => void;
  onEdit: (doc: ArchivedDocument) => void;
  onExportPdf: (doc: ArchivedDocument) => void;
}

export default function HistoryPreviewModal({ doc, onClose, onEdit, onExportPdf }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

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
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 px-4 py-6">
      <div className="flex h-full w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl border border-ink-100">
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-100 shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-ink-900">
              {doc.form.invoiceRef || doc.form.beneficiaryName || 'Document'}
            </h3>
            <p className="text-xs text-ink-500">Aperçu — les modifications se font depuis "Modifier ce document"</p>
          </div>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-900 text-lg leading-none px-1">
            ✕
          </button>
        </div>

        <div ref={wrapRef} className="flex-1 overflow-auto bg-ink-100 px-3 py-4">
          <div className="flex justify-center">
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
              <A4Preview form={doc.form} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-3 border-t border-ink-100 shrink-0">
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
            onClick={() => onEdit(doc)}
            className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            ✏️ Modifier ce document
          </button>
        </div>
      </div>
    </div>
  );
}
