import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import TransferFormFields from './components/TransferForm';
import A4Preview from './components/A4Preview';
import PrintButton from './components/PrintButton';
import SupplierForm from './components/SupplierForm';
import type { Supplier, TransferForm } from './types';
import { emptyForm } from './types';
import { loadSuppliers, saveSuppliers, loadCurrentForm, saveCurrentForm } from './utils/storage';
import { demoSuppliers } from './data/suppliers';
import { parseAmount } from './utils/formatAmount';

type RequiredKey =
  | 'beneficiaryAccountNumber'
  | 'beneficiaryName'
  | 'beneficiaryBank'
  | 'beneficiaryCountry'
  | 'beneficiaryCity'
  | 'currency'
  | 'amount'
  | 'orderAccountNumber';

export default function App() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<TransferForm>(emptyForm());
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null | 'new'>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  // Initial load
  useEffect(() => {
    const stored = loadSuppliers();
    if (stored.length === 0) {
      setSuppliers(demoSuppliers);
      saveSuppliers(demoSuppliers);
    } else {
      setSuppliers(stored);
    }
    const storedForm = loadCurrentForm();
    if (storedForm) setForm(storedForm);
  }, []);

  // Persist form
  useEffect(() => {
    saveCurrentForm(form);
  }, [form]);

  // Responsive scale of the A4 preview to fit available width
  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const A4_WIDTH_MM = 210;
    const PX_PER_MM = 96 / 25.4;
    const compute = () => {
      const available = el.clientWidth - 32;
      const natural = A4_WIDTH_MM * PX_PER_MM;
      setScale(Math.min(1, available / natural));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setField = <K extends keyof TransferForm>(key: K, value: TransferForm[K]) => {
    setForm((f) => ({ ...f, [key]: value, updatedAt: Date.now() }));
  };

  const selectSupplier = (s: Supplier) => {
    setForm((f) => ({
      ...f,
      supplierId: s.id,
      beneficiaryName: s.name,
      beneficiaryAddress: s.address,
      beneficiaryCity: s.city,
      beneficiaryCountry: s.country,
      beneficiaryAccountNumber: s.accountNumber,
      beneficiaryBank: s.bankName,
      updatedAt: Date.now(),
    }));
  };

  const saveSupplier = (s: Supplier) => {
    setSuppliers((prev) => {
      const exists = prev.some((p) => p.id === s.id);
      const next = exists ? prev.map((p) => (p.id === s.id ? s : p)) : [...prev, s];
      saveSuppliers(next);
      return next;
    });
    setEditingSupplier(null);
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveSuppliers(next);
      return next;
    });
    if (form.supplierId === id) {
      setField('supplierId', null);
    }
  };

  const errors = useMemo(() => {
    if (!showErrors) return {};
    const e: Partial<Record<RequiredKey, boolean>> = {};
    const amountNum = parseAmount(form.amount || '');
    if (!form.beneficiaryAccountNumber.trim()) e.beneficiaryAccountNumber = true;
    if (!form.beneficiaryName.trim()) e.beneficiaryName = true;
    if (!form.beneficiaryBank.trim()) e.beneficiaryBank = true;
    if (!form.beneficiaryCountry.trim()) e.beneficiaryCountry = true;
    if (!form.beneficiaryCity.trim()) e.beneficiaryCity = true;
    if (!form.currency) e.currency = true;
    if (!form.amount.trim() || Number.isNaN(amountNum) || amountNum <= 0) e.amount = true;
    if (!form.orderAccountNumber.trim()) e.orderAccountNumber = true;
    return e;
  }, [form, showErrors]);

  const isValid = () => {
    const amountNum = parseAmount(form.amount || '');
    return Boolean(
      form.beneficiaryAccountNumber.trim() &&
        form.beneficiaryName.trim() &&
        form.beneficiaryBank.trim() &&
        form.beneficiaryCountry.trim() &&
        form.beneficiaryCity.trim() &&
        form.currency &&
        form.amount.trim() &&
        !Number.isNaN(amountNum) &&
        amountNum > 0 &&
        form.orderAccountNumber.trim()
    );
  };

  const handlePrint = () => {
    if (!isValid()) {
      setShowErrors(true);
      return;
    }
    window.print();
  };

  const handleExportPdf = async () => {
    if (!isValid()) {
      setShowErrors(true);
      return;
    }
    if (!sheetRef.current) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ]);
      const canvas = await html2canvas(sheetRef.current, { scale: 3, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      const filename = `virement_${(form.beneficiaryName || 'fournisseur').replace(/\s+/g, '_')}_${form.date}.pdf`;
      pdf.save(filename);
    } finally {
      setExporting(false);
    }
  };

  const handleNew = () => {
    if (!confirm('Créer un nouveau formulaire vierge ? Les champs saisis seront réinitialisés.')) return;
    setForm(emptyForm());
    setShowErrors(false);
  };

  const handleDuplicate = () => {
    setForm((f) => ({ ...f, id: crypto.randomUUID(), updatedAt: Date.now() }));
  };

  const handleReset = () => {
    if (!confirm('Réinitialiser tous les champs du formulaire ?')) return;
    setForm((f) => ({ ...emptyForm(), city: f.city }));
    setShowErrors(false);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <header className="no-print flex items-center justify-between border-b border-ink-100 bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden rounded-md border border-ink-300 px-2.5 py-1 text-sm text-ink-700"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            ☰
          </button>
          <div>
            <h1 className="text-sm font-semibold text-ink-900">Virements fournisseurs</h1>
            <p className="text-[11px] text-ink-500">Préparation interne — CIH Bank</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNew}
            className="rounded-md px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-100 transition-colors"
          >
            Nouveau
          </button>
          <button
            onClick={handleDuplicate}
            className="rounded-md px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-100 transition-colors"
          >
            Dupliquer
          </button>
          <button
            onClick={handleReset}
            className="rounded-md px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-100 transition-colors"
          >
            Réinitialiser
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="rounded-md border border-ink-300 px-3.5 py-1.5 text-sm font-medium text-ink-800 hover:bg-ink-100 transition-colors disabled:opacity-50"
          >
            {exporting ? 'Export…' : '📄 Export PDF'}
          </button>
          <PrintButton onPrint={handlePrint} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`no-print fixed inset-y-0 left-0 z-40 w-72 transform transition-transform md:static md:translate-x-0 md:z-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar
            suppliers={suppliers}
            query={query}
            setQuery={setQuery}
            selectedId={form.supplierId}
            onSelect={(s) => {
              selectSupplier(s);
              setSidebarOpen(false);
            }}
            onEdit={(s) => setEditingSupplier(s)}
            onDelete={deleteSupplier}
            onAddNew={() => setEditingSupplier('new')}
          />
        </div>
        {sidebarOpen && (
          <div
            className="no-print fixed inset-0 z-30 bg-black/20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Form */}
        <div className="no-print w-full md:w-[420px] shrink-0 overflow-y-auto border-r border-ink-100 bg-white px-5 py-5">
          <TransferFormFields form={form} onChange={setField} errors={errors} />
        </div>

        {/* Preview */}
        <div ref={previewWrapRef} className="flex-1 overflow-auto bg-ink-100 px-4 py-6">
          <div id="print-root" className="flex justify-center">
            <div className="a4-scale-wrap" style={{ transform: `scale(${scale})` }}>
              <div ref={sheetRef}>
                <A4Preview form={form} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingSupplier !== null && (
        <SupplierForm
          initial={editingSupplier === 'new' ? null : editingSupplier}
          onSave={saveSupplier}
          onCancel={() => setEditingSupplier(null)}
        />
      )}
    </div>
  );
}
