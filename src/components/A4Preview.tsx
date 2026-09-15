import type { TransferForm } from '../types';
import { fields } from '../config/fieldsConfig';
import { formatAmountDigits, parseAmount } from '../utils/formatAmount';
import { amountToWords } from '../utils/amountToWords';

interface Props {
  form: TransferForm;
}

function Bar({ top, label }: { top: number; label: string }) {
  return (
    <div
      className="absolute left-[15mm] right-[15mm] bg-[#14181f] text-white flex items-center px-[3mm]"
      style={{ top: `${top}mm`, height: '6mm', fontSize: '9.5pt', letterSpacing: '0.02em' }}
    >
      {label}
    </div>
  );
}

function FieldLine({
  top,
  left = 15,
  width,
  label,
  required,
}: {
  top: number;
  left?: number;
  width?: number;
  label: string;
  required?: boolean;
}) {
  return (
    <div
      className="absolute text-[9pt] text-[#111417]"
      style={{ top: `${top}mm`, left: `${left}mm`, width: width ? `${width}mm` : undefined }}
    >
      {label}
      {required ? <span className="text-[#a33]"> *</span> : null}
    </div>
  );
}

function Underline({ top }: { top: number }) {
  return (
    <div
      className="absolute left-[15mm] right-[15mm] border-b border-[#111417]/40"
      style={{ top: `${top}mm` }}
    />
  );
}

function DataText({
  field,
  value,
  mono = true,
}: {
  field: keyof typeof fields;
  value: string;
  mono?: boolean;
}) {
  const pos = fields[field];
  if (!pos) return null;
  return (
    <div
      className={`absolute leading-tight ${mono ? 'font-[var(--font-mono-doc)]' : ''}`}
      style={{
        top: `${pos.y}mm`,
        left: `${pos.x}mm`,
        width: `${pos.width}mm`,
        fontSize: `${pos.fontSize}pt`,
        textAlign: pos.align ?? 'left',
        color: '#0b1f5c',
        wordBreak: 'break-word',
      }}
    >
      {value}
    </div>
  );
}

function Checkbox({ x, y, checked }: { x: number; y: number; checked: boolean }) {
  return (
    <div
      className="absolute border border-[#111417] flex items-center justify-center"
      style={{ top: `${y}mm`, left: `${x}mm`, width: '4mm', height: '4mm' }}
    >
      {checked && <span style={{ fontSize: '8pt', lineHeight: 1, color: '#0b1f5c' }}>✕</span>}
    </div>
  );
}

export default function A4Preview({ form }: Props) {
  const amountNum = parseAmount(form.amount || '0');
  const amountDigits = form.amount ? formatAmountDigits(form.amount) : '';
  const amountWords = form.amount && !Number.isNaN(amountNum) ? amountToWords(amountNum, form.currency) : '';

  return (
    <div className="a4-sheet">
      {/* En-tête */}
      <div className="absolute left-[15mm] top-[12mm] text-[13pt] font-semibold tracking-wide text-[#111417]">
        Ordre de virement à l'étranger
      </div>
      <div className="absolute right-[15mm] top-[13mm] text-[7.5pt] uppercase tracking-widest text-[#8a2b2b] border border-[#8a2b2b]/60 px-[2mm] py-[0.8mm]">
        Copie / Préparation interne
      </div>
      <div className="absolute left-[15mm] top-[18mm] right-[15mm] border-t border-[#111417]/30" />

      {/* Donneur d'ordre */}
      <FieldLine top={24} label="Donneur d'ordre" />
      <FieldLine top={40} label="Nom / raison sociale" />
      <DataText field="orderName" value={form.orderName} mono={false} />
      <FieldLine top={47} label="Compte N°" required />
      <DataText field="orderAccountNumber" value={form.orderAccountNumber} />
      <Underline top={51} />

      <div
        className="absolute left-[15mm] right-[15mm] text-[8.5pt] text-[#333d4d]"
        style={{ top: '55mm' }}
      >
        Par le débit du compte susmentionné, veuillez virer :
      </div>

      {/* Par (type d'opération) */}
      <Bar top={60} label="Par" />
      <Checkbox x={20} y={68.5} checked={form.operationType === 'SWIFT'} />
      <div className="absolute text-[9pt]" style={{ top: '68.5mm', left: '26mm' }}>SWIFT</div>
      <Checkbox x={55} y={68.5} checked={form.operationType === 'TELEX'} />
      <div className="absolute text-[9pt]" style={{ top: '68.5mm', left: '61mm' }}>Télex</div>
      <Checkbox x={90} y={68.5} checked={form.operationType === 'CHEQUE'} />
      <div className="absolute text-[9pt]" style={{ top: '68.5mm', left: '96mm' }}>Chèque</div>
      <div className="absolute text-[8pt] text-[#647089]" style={{ top: '68.5mm', right: '15mm' }}>
        (cocher la mention)
      </div>

      {/* La somme de */}
      <Bar top={76} label="La somme de" />
      <FieldLine top={83.5} left={15} width={38} label="Nature de la devise" required />
      <DataText field="currency" value={form.currency} mono={false} />
      <FieldLine top={83.5} left={105} width={40} label="Montant en chiffres" required />
      <DataText field="amountDigits" value={amountDigits} />
      <FieldLine top={90} label="Montant en lettres" required />
      <DataText field="amountWords" value={amountWords} mono={false} />
      <Underline top={103} />

      {/* Au profit de */}
      <Bar top={106} label="Au profit de" />
      <FieldLine top={114.5} label="Bénéficiaire" required />
      <DataText field="beneficiaryName" value={form.beneficiaryName} mono={false} />
      <FieldLine top={120.5} label="Adresse" />
      <DataText field="beneficiaryAddress" value={form.beneficiaryAddress} mono={false} />
      <FieldLine top={126.5} left={15} width={42} label="Ville" required />
      <DataText field="beneficiaryCity" value={form.beneficiaryCity} mono={false} />
      <FieldLine top={126.5} left={140} width={9} label="Pays" required />
      <div
        className="absolute text-[9pt] font-[var(--font-mono-doc)]"
        style={{ top: '126.5mm', left: '150mm', width: '48mm', color: '#0b1f5c' }}
      >
        {form.beneficiaryCountry}
      </div>
      <FieldLine top={132.5} left={15} width={44} label="Domiciliation — Compte N°" required />
      <DataText field="beneficiaryAccountNumber" value={form.beneficiaryAccountNumber} />
      <FieldLine top={138.5} label="Banque" required />
      <DataText field="beneficiaryBank" value={form.beneficiaryBank} mono={false} />
      <Underline top={143} />

      {/* En règlement de */}
      <Bar top={150} label="En règlement de" />
      <FieldLine top={159} label="Nature de l'opération" />
      <DataText field="operationNature" value={form.operationNature} mono={false} />
      <FieldLine top={165} label="N° et date facture(s)" />
      <DataText field="invoiceRef" value={form.invoiceRef} mono={false} />
      <FieldLine top={171} width={128} label="Frais et commissions à la charge du bénéficiaire" />
      <Checkbox x={148} y={170.5} checked={form.feesOnBeneficiary === 'Oui'} />
      <div className="absolute text-[9pt]" style={{ top: '170.5mm', left: '154mm' }}>Oui</div>
      <Checkbox x={168} y={170.5} checked={form.feesOnBeneficiary === 'Non'} />
      <div className="absolute text-[9pt]" style={{ top: '170.5mm', left: '174mm' }}>Non</div>
      <Underline top={176} />

      {/* Sous couvert de */}
      <Bar top={181} label="Sous couvert de" />
      <FieldLine top={187} label="Titre / importation" />
      <DataText field="importTitle" value={form.importTitle} mono={false} />
      <FieldLine top={193} label="Références — domicilié(s) chez" />
      <DataText field="references" value={form.references} mono={false} />
      <FieldLine top={201} label="Autorisation Office des Changes N°" />
      <DataText field="changeOfficeAuth" value={form.changeOfficeAuth} mono={false} />
      <Underline top={210} />

      {/* Date / lieu — sans signature reconstituée */}
      <div
        className="absolute text-[10.5pt]"
        style={{ top: '215mm', left: '15mm' }}
      >
        {form.city}, le {form.date ? new Date(form.date).toLocaleDateString('fr-FR') : ''}
      </div>
      <div className="absolute text-[9pt] text-[#647089]" style={{ top: '215mm', right: '15mm', width: '55mm', textAlign: 'right' }}>
        Signature donneur d'ordre
        <div className="mt-[10mm] border-b border-[#111417]/30" />
      </div>

      {/* Cadre réservé à l'agence — laissé vierge intentionnellement */}
      <div
        className="absolute left-[15mm] right-[15mm] border border-[#111417]/40"
        style={{ top: '236mm', bottom: '15mm' }}
      >
        <div className="bg-[#14181f] text-white text-[8.5pt] px-[3mm]" style={{ height: '6mm', display: 'flex', alignItems: 'center' }}>
          Cadre réservé à l'agence
        </div>
        <div className="px-[3mm] py-[3mm] text-[8.5pt] text-[#8a939f] italic">
          Zone non renseignée par cette application — réservée au traitement bancaire.
        </div>
      </div>
    </div>
  );
}
