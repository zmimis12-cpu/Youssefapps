import type { OperationType, OwnAccount, TransferForm as TransferFormType } from '../types';
import AmountToWords from './AmountToWords';
import CurrencySelect from './CurrencySelect';
import OwnAccountPicker from './OwnAccountPicker';

interface Props {
  form: TransferFormType;
  onChange: <K extends keyof TransferFormType>(key: K, value: TransferFormType[K]) => void;
  errors: Partial<Record<keyof TransferFormType, boolean>>;
  ownAccounts: OwnAccount[];
  onSelectOwnAccount: (a: OwnAccount) => void;
  onAddOwnAccount: () => void;
  onEditOwnAccount: (a: OwnAccount) => void;
  onDeleteOwnAccount: (id: string) => void;
}

const operationTypes: OperationType[] = ['SWIFT', 'TELEX', 'CHEQUE'];

export default function TransferForm({
  form,
  onChange,
  errors,
  ownAccounts,
  onSelectOwnAccount,
  onAddOwnAccount,
  onEditOwnAccount,
  onDeleteOwnAccount,
}: Props) {
  return (
    <div className="space-y-6">
      <Section title="Donneur d'ordre">
        <OwnAccountPicker
          accounts={ownAccounts}
          selectedId={form.ownAccountId}
          onSelect={onSelectOwnAccount}
          onAddNew={onAddOwnAccount}
          onEdit={onEditOwnAccount}
          onDelete={onDeleteOwnAccount}
        />
        <Row>
          <TextInput
            label="Compte N°"
            value={form.orderAccountNumber}
            onChange={(v) => onChange('orderAccountNumber', v)}
            error={errors.orderAccountNumber}
            required
          />
          <TextInput
            label="Nom (optionnel)"
            value={form.orderName}
            onChange={(v) => onChange('orderName', v)}
          />
        </Row>
      </Section>

      <Section title="Opération">
        <div>
          <span className="text-xs font-medium text-ink-500">Type</span>
          <div className="mt-1.5 flex gap-2">
            {operationTypes.map((t) => (
              <button
                key={t}
                onClick={() => onChange('operationType', t)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  form.operationType === t
                    ? 'border-teal-600 bg-teal-100 text-teal-700'
                    : 'border-ink-300 text-ink-700 hover:bg-ink-100'
                }`}
              >
                {t === 'CHEQUE' ? 'Chèque' : t === 'TELEX' ? 'Télex' : 'SWIFT'}
              </button>
            ))}
          </div>
        </div>
        <Row>
          <CurrencySelect
            value={form.currency}
            onChange={(c) => onChange('currency', c)}
            error={errors.currency}
          />
          <TextInput
            label="Montant"
            value={form.amount}
            onChange={(v) => onChange('amount', v)}
            error={errors.amount}
            required
            placeholder="27302.50"
          />
        </Row>
        <AmountToWords amount={form.amount} currency={form.currency} />
      </Section>

      <Section title="Bénéficiaire">
        <TextInput
          label="Nom"
          value={form.beneficiaryName}
          onChange={(v) => onChange('beneficiaryName', v)}
          error={errors.beneficiaryName}
          required
        />
        <TextInput
          label="Adresse"
          value={form.beneficiaryAddress}
          onChange={(v) => onChange('beneficiaryAddress', v)}
        />
        <Row>
          <TextInput
            label="Ville"
            value={form.beneficiaryCity}
            onChange={(v) => onChange('beneficiaryCity', v)}
            error={errors.beneficiaryCity}
            required
          />
          <TextInput
            label="Pays"
            value={form.beneficiaryCountry}
            onChange={(v) => onChange('beneficiaryCountry', v)}
            error={errors.beneficiaryCountry}
            required
          />
        </Row>
        <TextInput
          label="Compte N°"
          value={form.beneficiaryAccountNumber}
          onChange={(v) => onChange('beneficiaryAccountNumber', v)}
          error={errors.beneficiaryAccountNumber}
          required
        />
        <TextInput
          label="Banque"
          value={form.beneficiaryBank}
          onChange={(v) => onChange('beneficiaryBank', v)}
          error={errors.beneficiaryBank}
          required
        />
      </Section>

      <Section title="Enregistrement">
        <TextInput
          label="Nature de l'opération"
          value={form.operationNature}
          onChange={(v) => onChange('operationNature', v)}
        />
        <TextInput
          label="N° et date facture(s)"
          value={form.invoiceRef}
          onChange={(v) => onChange('invoiceRef', v)}
        />
        <div>
          <span className="text-xs font-medium text-ink-500">
            Frais et commissions à la charge du bénéficiaire
          </span>
          <div className="mt-1.5 flex gap-2">
            {(['Oui', 'Non'] as const).map((v) => (
              <button
                key={v}
                onClick={() => onChange('feesOnBeneficiary', v)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  form.feesOnBeneficiary === v
                    ? 'border-teal-600 bg-teal-100 text-teal-700'
                    : 'border-ink-300 text-ink-700 hover:bg-ink-100'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Sous couvert de">
        <TextInput
          label="Titre / importation"
          value={form.importTitle}
          onChange={(v) => onChange('importTitle', v)}
        />
        <Row>
          <TextInput
            label="Références"
            value={form.references}
            onChange={(v) => onChange('references', v)}
          />
          <TextInput
            label="Domicilié(s) chez"
            value={form.domicileChez}
            onChange={(v) => onChange('domicileChez', v)}
          />
        </Row>
        <Row>
          <TextInput
            label="Autorisation Office des Changes N°"
            value={form.changeOfficeAuth}
            onChange={(v) => onChange('changeOfficeAuth', v)}
          />
          <TextInput
            label="Date (autorisation)"
            value={form.authDate}
            onChange={(v) => onChange('authDate', v)}
            placeholder="jj/mm/aaaa"
          />
        </Row>
      </Section>

      <Section title="Date">
        <Row>
          <TextInput label="Ville" value={form.city} onChange={(v) => onChange('city', v)} />
          <div>
            <span className="text-xs font-medium text-ink-500">Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => onChange('date', e.target.value)}
              className="mt-1 w-full rounded-md border border-ink-300 px-2.5 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
            />
          </div>
        </Row>
      </Section>

      <Section title="Document">
        <TextInput
          label="En-tête banque (modifiable, vide = masqué)"
          value={form.bankHeaderText}
          onChange={(v) => onChange('bankHeaderText', v)}
          placeholder="CIH BANK"
        />
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={form.showAgencyBox}
            onChange={(e) => onChange('showAgencyBox', e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-teal-600 focus:ring-teal-500/40"
          />
          Afficher le cadre réservé à l'agence
        </label>
        {form.showAgencyBox && (
          <TextInput
            label="Libellé du cadre agence"
            value={form.agencyBoxLabel}
            onChange={(v) => onChange('agencyBoxLabel', v)}
            placeholder="Cadre réservé à l'agence"
          />
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-2.5">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function TextInput({
  label,
  value,
  onChange,
  required,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-500">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${
          error ? 'border-red-400' : 'border-ink-300 focus:border-teal-500'
        }`}
      />
    </label>
  );
}
