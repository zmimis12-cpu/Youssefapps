import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import TransferFormFields from './components/TransferForm';
import A4Preview from './components/A4Preview';
import PrintButton from './components/PrintButton';
import SupplierForm from './components/SupplierForm';
import OwnAccountForm from './components/OwnAccountForm';
import HistorySidebar from './components/HistorySidebar';
import type { ArchivedDocument, OwnAccount, Supplier, TransferForm } from './types';
import { emptyForm } from './types';
import {
  loadSuppliers,
  saveSuppliers,
  loadOwnAccounts,
  saveOwnAccounts,
  loadCurrentForm,
  saveCurrentForm,
  loadHistory,
  saveHistory,
  fetchSuppliersFromSupabase,
  upsertSupplierToSupabase,
  deleteSupplierFromSupabase,
  fetchOwnAccountsFromSupabase,
  upsertOwnAccountToSupabase,
  deleteOwnAccountFromSupabase,
  fetchHistoryFromSupabase,
  upsertHistoryToSupabase,
  deleteHistoryFromSupabase,
  isSupabaseConfigured,
  haveSuppliersBeenSeeded,
  markSuppliersSeeded,
} from './utils/storage';
import { demoSuppliers } from './data/suppliers';
import { parseAmount } from './utils/formatAmount';

// Un canvas quasi entièrement blanc = échec silencieux du rendu SVG
// foreignObject (bug connu sur WebKit). On sous-échantillonne pour rester
// rapide même sur un grand canvas.
function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  const step = 17; // pas premier pour éviter de retomber sur un motif régulier
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let nonWhite = 0;
  for (let i = 0; i < data.length; i += 4 * step) {
    if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) {
      nonWhite++;
      if (nonWhite > 20) return false;
    }
  }
  return true;
}

// Génère le PDF A4 à partir d'un élément .a4-sheet déjà rendu dans le DOM.
// Le document (A4Preview) n'utilise que des styles inline, jamais de
// classes Tailwind : sur certains navigateurs, html2canvas ne parvient pas à
// lire la feuille de style externe générée par Tailwind v4 et ignore alors
// silencieusement tout le style, y compris "position: absolute" — d'où un
// document qui s'affichait en texte brut empilé. Les styles inline restent
// toujours appliqués car ce sont des propriétés du DOM, jamais dépendantes
// d'une feuille de style externe.
async function renderSheetToPdf(sheetEl: HTMLElement, formData: TransferForm) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ]);
  await document.fonts.ready;

  const baseOptions = {
    scale: 3,
    backgroundColor: '#ffffff',
    useCORS: true,
    windowWidth: sheetEl.scrollWidth,
    windowHeight: sheetEl.scrollHeight,
  } as const;

  // Le rendu SVG foreignObject donne le meilleur résultat texte, mais rend
  // une page blanche sur certains WebKit (bug connu de la librairie) — on
  // l'essaie d'abord et on retombe sur le rendu DOM manuel seulement si la
  // page obtenue est vide.
  let canvas = await html2canvas(sheetEl, { ...baseOptions, foreignObjectRendering: true });
  if (isCanvasBlank(canvas)) {
    canvas = await html2canvas(sheetEl, { ...baseOptions, foreignObjectRendering: false });
  }
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
  const filename = `virement_${(formData.beneficiaryName || 'fournisseur').replace(/\s+/g, '_')}_${formData.date}.pdf`;
  pdf.save(filename);
}

// Génère le PDF d'un document (ex. depuis l'historique) sans toucher au
// formulaire actuellement affiché : le rend hors-écran, capture, puis nettoie.
async function exportFormToPdf(formData: TransferForm) {
  const ReactDOMClient = await import('react-dom/client');
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  document.body.appendChild(container);
  const root = ReactDOMClient.createRoot(container);
  try {
    await new Promise<void>((resolve) => {
      root.render(<A4Preview form={formData} />);
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    const sheetEl = container.querySelector('.a4-sheet') as HTMLElement | null;
    if (!sheetEl) throw new Error('Rendu du document introuvable');
    await renderSheetToPdf(sheetEl, formData);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}

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
  const [history, setHistory] = useState<ArchivedDocument[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<TransferForm>(emptyForm());
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null | 'new'>(null);
  const [editingOwnAccount, setEditingOwnAccount] = useState<OwnAccount | null | 'new'>(null);
  const [leftPanel, setLeftPanel] = useState<'suppliers' | 'history'>('suppliers');
  const [showErrors, setShowErrors] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [scale, setScale] = useState(1);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
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
    setHistory(loadHistory());

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
      fetchHistoryFromSupabase().then((remote) => {
        if (remote !== null) {
          setHistory(remote);
          saveHistory(remote);
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

  const archiveCurrentDocument = () => {
    const doc: ArchivedDocument = {
      id: crypto.randomUUID(),
      printedAt: Date.now(),
      paid: false,
      form,
    };
    setHistory((prev) => {
      const next = [doc, ...prev];
      saveHistory(next);
      return next;
    });
    upsertHistoryToSupabase(doc);
  };

  const handlePrint = () => {
    const missing = missingFieldsMessage();
    if (missing.length > 0) {
      setShowErrors(true);
      alert(`Merci de compléter les champs obligatoires avant d'imprimer :\n\n• ${missing.join('\n• ')}`);
      return;
    }
    archiveCurrentDocument();
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
      await renderSheetToPdf(sheetRef.current, form);
      archiveCurrentDocument();
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

  // Réexport depuis l'historique : génère directement le PDF de ce document
  // archivé, sans toucher au formulaire affiché et sans créer une nouvelle
  // entrée d'historique (le document existe déjà).
  const exportHistoryDocPdf = async (doc: ArchivedDocument) => {
    try {
      await exportFormToPdf(doc.form);
    } catch (err) {
      console.error('Export PDF (historique) a échoué :', err);
      alert("L'export PDF a échoué. Réessaie dans quelques instants.");
    }
  };

  const togglePaid = (id: string) => {
    setHistory((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, paid: !d.paid } : d));
      saveHistory(next);
      const updated = next.find((d) => d.id === id);
      if (updated) upsertHistoryToSupabase(updated);
      return next;
    });
  };

  const deleteFromHistory = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((d) => d.id !== id);
      saveHistory(next);
      return next;
    });
    deleteHistoryFromSupabase(id);
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
            onClick={() => {
              setLeftPanel('history');
              setSidebarOpen(true);
            }}
            className="rounded-md px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-100 transition-colors"
          >
            📜 Historique
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
          className={`no-print fixed inset-y-0 left-0 z-40 w-72 flex flex-col transform transition-transform md:static md:translate-x-0 md:z-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex border-b border-ink-100 bg-white shrink-0">
            <button
              onClick={() => setLeftPanel('suppliers')}
              className={`flex-1 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                leftPanel === 'suppliers'
                  ? 'text-teal-700 border-b-2 border-teal-600'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              Fournisseurs
            </button>
            <button
              onClick={() => setLeftPanel('history')}
              className={`flex-1 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                leftPanel === 'history'
                  ? 'text-teal-700 border-b-2 border-teal-600'
                  : 'text-ink-500 hover:text-ink-900'
              }`}
            >
              Historique
            </button>
          </div>
          <div className="flex-1 min-h-0">
            {leftPanel === 'suppliers' ? (
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
            ) : (
              <HistorySidebar
                history={history}
                ownAccounts={ownAccounts}
                onExportPdf={exportHistoryDocPdf}
                onTogglePaid={togglePaid}
                onDelete={deleteFromHistory}
              />
            )}
          </div>
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
