import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import TransferFormFields from './components/TransferForm';
import A4Preview from './components/A4Preview';
import PrintButton from './components/PrintButton';
import SupplierForm from './components/SupplierForm';
import OwnAccountForm from './components/OwnAccountForm';
import type { OwnAccount, Supplier, TransferForm } from './types';
import { emptyForm } from './types';
import {
  loadSuppliers,
  saveSuppliers,
  loadOwnAccounts,
  saveOwnAccounts,
  loadCurrentForm,
  saveCurrentForm,
  fetchSuppliersFromSupabase,
  upsertSupplierToSupabase,
  deleteSupplierFromSupabase,
  fetchOwnAccountsFromSupabase,
  upsertOwnAccountToSupabase,
  deleteOwnAccountFromSupabase,
  isSupabaseConfigured,
  haveSuppliersBeenSeeded,
  markSuppliersSeeded,
} from './utils/storage';
import { demoSuppliers } from './data/suppliers';
import { parseAmount } from './utils/formatAmount';

type RequiredKey =
  | 'beneficiaryAccountNumber'
  | 'beneficiaryName'
  | 'beneficiaryBank'
  | 'beneficiaryCountry'
  | 'currency'
  | 'amount'
  | 'orderAccountNumber';

export default function App() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ownAccounts, setOwnAccounts] = useState<OwnAccount[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<TransferForm>(emptyForm());
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null | 'new'>(null);
  const [editingOwnAccount, setEditingOwnAccount] = useState<OwnAccount | null | 'new'>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'unconfigured' | 'checking' | 'connected' | 'error'>(
    isSupabaseConfigured ? 'checking' : 'unconfigured'
  );

  // Initial load — essaie Supabase en premier (si configuré), retombe sur la
  // cache locale sinon (hors ligne, projet Supabase pas encore prêt, etc.)
  // Les 3 fournisseurs de démo ne sont semés qu'au tout premier lancement
  // (voir haveSuppliersBeenSeeded) — jamais réintroduits après une suppression.
  useEffect(() => {
    const local = loadSuppliers();
    const alreadySeeded = haveSuppliersBeenSeeded();
    if (!alreadySeeded && local.length === 0) {
      setSuppliers(demoSuppliers);
      saveSuppliers(demoSuppliers);
      markSuppliersSeeded();
    } else {
      setSuppliers(local);
    }
    setOwnAccounts(loadOwnAccounts());

    if (isSupabaseConfigured) {
      let suppliersOk = false;
      let ownAccountsOk = false;
      const settle = () => {
        if (suppliersOk && ownAccountsOk) setSyncStatus('connected');
      };

      fetchSuppliersFromSupabase().then((remote) => {
        if (remote !== null) {
          suppliersOk = true;
          if (remote.length > 0) {
            setSuppliers(remote);
            saveSuppliers(remote);
            markSuppliersSeeded();
          } else if (!alreadySeeded && local.length === 0) {
            // Base distante vide et rien en local : vrai premier lancement,
            // on y sème les 3 fournisseurs de démonstration.
            demoSuppliers.forEach((s) => upsertSupplierToSupabase(s));
            markSuppliersSeeded();
          } else {
            // Base distante réellement vide (déjà initialisée ailleurs, tout
            // supprimé) : c'est la source de vérité une fois Supabase actif —
            // on aligne ce navigateur dessus au lieu de garder son ancien
            // cache local. Sans ce cas, un appareil resynchronisé après une
            // suppression sur un autre appareil gardait ses fournisseurs
            // obsolètes indéfiniment.
            setSuppliers([]);
            saveSuppliers([]);
            markSuppliersSeeded();
          }
          settle();
        } else {
          setSyncStatus('error');
        }
      });
      fetchOwnAccountsFromSupabase().then((remote) => {
        if (remote !== null) {
          ownAccountsOk = true;
          setOwnAccounts(remote);
          saveOwnAccounts(remote);
          settle();
        } else {
          setSyncStatus('error');
        }
      });
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
    upsertSupplierToSupabase(s);
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
    deleteSupplierFromSupabase(id);
  };

  const selectOwnAccount = (a: OwnAccount) => {
    setForm((f) => ({
      ...f,
      ownAccountId: a.id,
      orderName: a.name,
      orderAccountNumber: a.accountNumber,
      updatedAt: Date.now(),
    }));
  };

  const saveOwnAccount = (a: OwnAccount) => {
    setOwnAccounts((prev) => {
      const exists = prev.some((p) => p.id === a.id);
      const next = exists ? prev.map((p) => (p.id === a.id ? a : p)) : [...prev, a];
      saveOwnAccounts(next);
      return next;
    });
    setEditingOwnAccount(null);
    // Applique immédiatement le compte enregistré au formulaire courant.
    selectOwnAccount(a);
    upsertOwnAccountToSupabase(a);
  };

  const deleteOwnAccount = (id: string) => {
    setOwnAccounts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveOwnAccounts(next);
      return next;
    });
    if (form.ownAccountId === id) {
      setField('ownAccountId', null);
    }
    deleteOwnAccountFromSupabase(id);
  };

  const errors = useMemo(() => {
    if (!showErrors) return {};
    const e: Partial<Record<RequiredKey, boolean>> = {};
    const amountNum = parseAmount(form.amount || '');
    if (!form.beneficiaryAccountNumber.trim()) e.beneficiaryAccountNumber = true;
    if (!form.beneficiaryName.trim()) e.beneficiaryName = true;
    if (!form.beneficiaryBank.trim()) e.beneficiaryBank = true;
    if (!form.beneficiaryCountry.trim()) e.beneficiaryCountry = true;
    if (!form.currency) e.currency = true;
    if (!form.amount.trim() || Number.isNaN(amountNum) || amountNum <= 0) e.amount = true;
    if (!form.orderAccountNumber.trim()) e.orderAccountNumber = true;
    return e;
  }, [form, showErrors]);

  const missingFieldsMessage = () => {
    const amountNum = parseAmount(form.amount || '');
    const missing: string[] = [];
    if (!form.orderAccountNumber.trim()) missing.push('Compte N° (donneur d\'ordre)');
    if (!form.beneficiaryName.trim()) missing.push('Bénéficiaire');
    if (!form.beneficiaryCountry.trim()) missing.push('Pays');
    if (!form.beneficiaryAccountNumber.trim()) missing.push('Compte bénéficiaire');
    if (!form.beneficiaryBank.trim()) missing.push('Banque');
    if (!form.currency) missing.push('Devise');
    if (!form.amount.trim() || Number.isNaN(amountNum) || amountNum <= 0) missing.push('Montant');
    return missing;
  };

  const handlePrint = () => {
    const missing = missingFieldsMessage();
    if (missing.length > 0) {
      setShowErrors(true);
      alert(`Merci de compléter les champs obligatoires avant d'imprimer :\n\n• ${missing.join('\n• ')}`);
      return;
    }
    window.print();
  };

  const handleExportPdf = async () => {
    const missing = missingFieldsMessage();
    if (missing.length > 0) {
      setShowErrors(true);
      alert(`Merci de compléter les champs obligatoires avant d'exporter :\n\n• ${missing.join('\n• ')}`);
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
    } catch (err) {
      console.error('Export PDF a échoué :', err);
      alert(
        "L'export PDF a échoué. Réessaie, ou utilise \"Imprimer A4\" puis choisis " +
          '"Enregistrer au format PDF" dans la fenêtre d\'impression du navigateur.'
      );
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
            <p className="text-[11px] text-ink-500">
              Préparation interne — CIH Bank
              {syncStatus === 'connected' && <span className="text-teal-600"> · synchronisé</span>}
              {syncStatus === 'checking' && <span className="text-ink-500"> · connexion…</span>}
              {syncStatus === 'error' && (
                <span className="text-red-500" title="Supabase configuré mais injoignable — vérifie SUPABASE.md">
                  {' '}
                  · non synchronisé (local uniquement)
                </span>
              )}
            </p>
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
          <TransferFormFields
            form={form}
            onChange={setField}
            errors={errors}
            ownAccounts={ownAccounts}
            onSelectOwnAccount={selectOwnAccount}
            onAddOwnAccount={() => setEditingOwnAccount('new')}
            onEditOwnAccount={(a) => setEditingOwnAccount(a)}
            onDeleteOwnAccount={deleteOwnAccount}
          />
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

      {editingOwnAccount !== null && (
        <OwnAccountForm
          initial={editingOwnAccount === 'new' ? null : editingOwnAccount}
          onSave={saveOwnAccount}
          onCancel={() => setEditingOwnAccount(null)}
        />
      )}
    </div>
  );
}
