import type { CSSProperties } from 'react';
import type { TransferForm } from '../types';
import { fields } from '../config/fieldsConfig';
import { formatAmountDigits, parseAmount } from '../utils/formatAmount';
import { amountToWords } from '../utils/amountToWords';
import { writtenLabelFor } from '../data/currencies';

interface Props {
  form: TransferForm;
}

// Ce composant est aussi bien affiché à l'écran qu'imprimé (bouton
// "Imprimer A4" / "Export PDF", qui utilisent tous deux le moteur
// d'impression natif du navigateur). Styles en inline plutôt qu'en classes
// Tailwind : plus simple à garder identique entre écran et impression, et
// ça évite toute dépendance à l'ordre de chargement d'une feuille de style
// externe pour un document qui doit rester fiable dans tous les cas.

const INK = '#111417';
const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_MONO = '"Courier New", ui-monospace, monospace';

function Bar({ top, label }: { top: number; label: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '15mm',
        right: '15mm',
        top: `${top}mm`,
        height: '6mm',
        background: '#14181f',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '3mm',
        paddingRight: '3mm',
        fontSize: '9.5pt',
        letterSpacing: '0.02em',
        fontFamily: FONT_SERIF,
      }}
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
      style={{
        position: 'absolute',
        top: `${top}mm`,
        left: `${left}mm`,
        width: width ? `${width}mm` : undefined,
        fontSize: '9pt',
        color: INK,
        fontFamily: FONT_SERIF,
      }}
    >
      {label}
      {required ? ' *' : null}
    </div>
  );
}

function Underline({ top }: { top: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '15mm',
        right: '15mm',
        top: `${top}mm`,
        borderBottom: `1px solid ${INK}66`,
      }}
    />
  );
}

function DataText({
  field,
  value,
  mono = true,
  bold = false,
  uppercase = false,
}: {
  field: keyof typeof fields;
  value: string;
  mono?: boolean;
  bold?: boolean;
  uppercase?: boolean;
}) {
  const pos = fields[field];
  if (!pos) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: `${pos.y}mm`,
        left: `${pos.x}mm`,
        width: `${pos.width}mm`,
        fontSize: `${pos.fontSize}pt`,
        textAlign: pos.align ?? 'left',
        color: INK,
        wordBreak: 'break-word',
        lineHeight: 1.25,
        fontFamily: mono ? FONT_MONO : FONT_SERIF,
        fontWeight: bold ? 600 : 400,
        textTransform: uppercase ? 'uppercase' : undefined,
      }}
    >
      {value}
    </div>
  );
}

function Checkbox({ x, y, checked }: { x: number; y: number; checked: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: `${y}mm`,
        left: `${x}mm`,
        width: '4mm',
        height: '4mm',
        border: `1px solid ${INK}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && <span style={{ fontSize: '8pt', lineHeight: 1, color: INK }}>✕</span>}
    </div>
  );
}

function Plain({
  top,
  left,
  right,
  width,
  fontSize = '9pt',
  textAlign,
  children,
}: {
  top: number;
  left?: number;
  right?: number;
  width?: string;
  fontSize?: string;
  textAlign?: CSSProperties['textAlign'];
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}mm`,
        left: left !== undefined ? `${left}mm` : undefined,
        right: right !== undefined ? `${right}mm` : undefined,
        width,
        fontSize,
        textAlign,
        color: INK,
        fontFamily: FONT_SERIF,
      }}
    >
      {children}
    </div>
  );
}

export default function A4Preview({ form }: Props) {
  const amountNum = parseAmount(form.amount || '0');
  const amountDigits = form.amount ? formatAmountDigits(form.amount) : '';
  const amountWords = form.amount && !Number.isNaN(amountNum) ? amountToWords(amountNum, form.currency) : '';

  return (
    <div
      className="a4-sheet"
      style={{
        position: 'relative',
        width: '210mm',
        height: '297mm',
        background: '#ffffff',
        overflow: 'hidden',
        color: '#111417',
        fontFamily: FONT_SERIF,
        boxSizing: 'border-box',
        // Georgia (police du document) utilise par défaut des chiffres
        // "à l'ancienne" (hauteurs inégales, ex. 3/5/7/9 qui descendent sous
        // la ligne) — mauvais pour des numéros de compte/facture. Réglé ici
        // une fois pour tout le document ; hérité par tous les éléments.
        fontVariantNumeric: 'lining-nums',
      }}
    >
      {/* En-tête — logotype de banque modifiable/masquable depuis le formulaire
          (section "Document"), titre encadré "TRANSFERT A L'ETRANGER" fixe car
          imprimé sur l'original. Aucun cachet ni signature bancaire reproduit. */}
      {form.bankHeaderText.trim() && (
        <div
          style={{
            position: 'absolute',
            left: '15mm',
            top: '13mm',
            display: 'flex',
            alignItems: 'baseline',
            gap: '1.5mm',
          }}
        >
          <span style={{ fontSize: '15pt', fontWeight: 700, color: INK, fontFamily: FONT_SERIF }}>
            {form.bankHeaderText.trim()}
          </span>
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          right: '15mm',
          top: '12mm',
          border: `2px solid ${INK}`,
          paddingLeft: '4mm',
          paddingRight: '4mm',
          paddingTop: '2mm',
          paddingBottom: '2mm',
          fontSize: '11pt',
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '0.03em',
          fontFamily: FONT_SERIF,
        }}
      >
        TRANSFERT A L'ETRANGER
      </div>

      {/* Cadre "Destinataire" — reproduit le cadre imprimé sous le titre
          (banque + agence destinataire). Aucun cachet, seulement le texte
          imprimé "C.I.H" et le champ "Agence", modifiable dans "Document". */}
      <div
        style={{
          position: 'absolute',
          left: '133mm',
          right: '15mm',
          top: '24mm',
          bottom: '244mm',
          border: `1px solid ${INK}b3`,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '8pt', letterSpacing: '0.15em', color: INK, paddingTop: '2mm' }}>
          — DESTINATAIRE —
        </div>
        <div style={{ fontSize: '10pt', fontWeight: 700, color: INK, marginTop: '1mm' }}>C.I.H</div>
        <div style={{ borderTop: `1px solid ${INK}4d`, marginTop: '2mm' }} />
        <div style={{ textAlign: 'left', paddingLeft: '3mm', paddingTop: '1.5mm', fontSize: '8.5pt', color: INK }}>
          Agence
        </div>
        <div
          style={{
            textAlign: 'left',
            paddingLeft: '3mm',
            paddingTop: '1mm',
            fontSize: '11pt',
            fontWeight: 600,
            color: INK,
          }}
        >
          {form.agencyDestination}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: '15mm',
          top: '22mm',
          right: '130mm',
          borderTop: `1px solid ${INK}4d`,
        }}
      />

      {/* Donneur d'ordre */}
      <FieldLine top={27} label="Donneur d'Ordre" />
      <FieldLine top={40} label="Nom / raison sociale" />
      <DataText field="orderName" value={form.orderName} mono={false} bold />
      <FieldLine top={47} label="Compte N°" required />
      <DataText field="orderAccountNumber" value={form.orderAccountNumber} bold />
      <Underline top={51} />

      <Plain top={55} left={15} right={15} fontSize="8.5pt">
        Par le débit du compte susmentionné, veuillez virer :
      </Plain>

      {/* Par (type d'opération) */}
      <Bar top={60} label="Par" />
      <Checkbox x={20} y={68.5} checked={form.operationType === 'SWIFT'} />
      <Plain top={68.5} left={26}>SWIFT</Plain>
      <Checkbox x={55} y={68.5} checked={form.operationType === 'TELEX'} />
      <Plain top={68.5} left={61}>Télex</Plain>
      <Checkbox x={90} y={68.5} checked={form.operationType === 'CHEQUE'} />
      <Plain top={68.5} left={96}>Chèque</Plain>
      <Plain top={68.5} right={15} fontSize="8pt">
        (cocher la mention)
      </Plain>

      {/* La somme de — la devise est toujours réécrite en toutes lettres à la
          fin du montant en chiffres ET du montant en lettres. */}
      <Bar top={76} label="La somme de" />
      <FieldLine top={83.5} left={15} width={38} label="Nature de la devise" required />
      <DataText field="currency" value={writtenLabelFor(form.currency)} mono={false} bold />
      <FieldLine top={83.5} left={100} width={38} label="Montant en chiffres" required />
      <DataText
        field="amountDigits"
        value={amountDigits ? `${amountDigits} ${writtenLabelFor(form.currency)}` : ''}
        bold
      />
      <FieldLine top={90} label="Montant en lettres" required />
      <DataText field="amountWords" value={amountWords} mono={false} bold />
      <Underline top={103} />

      {/* Au profit de */}
      <Bar top={106} label="Au profit de" />
      <FieldLine top={114.5} label="Bénéficiaire" required />
      <DataText field="beneficiaryName" value={form.beneficiaryName} mono={false} bold />
      <FieldLine top={120.5} left={15} width={18} label="Pays" required />
      <DataText field="beneficiaryCountry" value={form.beneficiaryCountry} mono={false} />
      <FieldLine top={126.5} left={15} width={44} label="Domiciliation — Compte N°" required />
      <DataText field="beneficiaryAccountNumber" value={form.beneficiaryAccountNumber} bold />
      <FieldLine top={132.5} label="Banque" required />
      <DataText field="beneficiaryBank" value={form.beneficiaryBank} mono={false} bold />
      <Underline top={137} />

      {/* En règlement de */}
      <Bar top={142} label="En règlement de" />
      <FieldLine top={150} label="N° et date facture(s)" />
      <DataText field="invoiceRef" value={form.invoiceRef} mono={false} uppercase />
      <FieldLine top={156} width={128} label="Frais et commissions à la charge du bénéficiaire" />
      <Checkbox x={148} y={155.5} checked={form.feesOnBeneficiary === 'Oui'} />
      <Plain top={155.5} left={154}>Oui</Plain>
      <Checkbox x={168} y={155.5} checked={form.feesOnBeneficiary === 'Non'} />
      <Plain top={155.5} left={174}>Non</Plain>
      <Underline top={161} />

      {/* Sous couvert de */}
      <Bar top={166} label="Sous couvert de" />
      <FieldLine top={172} label="Titre / importation" />
      <DataText field="importTitle" value={form.importTitle} mono={false} />
      <FieldLine top={178} left={15} width={33} label="Références" />
      <DataText field="references" value={form.references} mono={false} />
      <FieldLine top={178} left={100} width={35} label="domicilié(s) chez" />
      <DataText field="domicileChez" value={form.domicileChez} mono={false} />
      <FieldLine top={184} left={15} width={58} label="Autorisation Office des Changes N°" />
      <DataText field="changeOfficeAuth" value={form.changeOfficeAuth} mono={false} />
      <FieldLine top={184} left={146} width={12} label="Date" />
      <DataText field="authDate" value={form.authDate} mono={false} />
      <Underline top={190} />

      {/* Date / lieu — sans signature reconstituée */}
      <Plain top={197} left={15} fontSize="10.5pt">
        {form.city}, le {form.date ? new Date(form.date).toLocaleDateString('fr-FR') : ''}
      </Plain>
      <div
        style={{
          position: 'absolute',
          top: '197mm',
          right: '15mm',
          width: '55mm',
          textAlign: 'right',
          fontSize: '9pt',
          color: INK,
          fontFamily: FONT_SERIF,
        }}
      >
        Signature donneur d'ordre
        <div style={{ marginTop: '10mm', borderBottom: `1px solid ${INK}4d` }} />
      </div>

      {/* Cadre réservé à l'agence — mêmes libellés imprimés que l'original.
          Zone volontairement laissée vierge : ni cachet ni signature d'agence
          ne sont reproduits, cette partie reste à remplir par la banque.
          Masquable / renommable depuis le formulaire (section "Document"). */}
      {form.showAgencyBox && (
        <div
          style={{
            position: 'absolute',
            left: '15mm',
            right: '15mm',
            top: '210mm',
            bottom: '15mm',
            border: `1px solid ${INK}66`,
          }}
        >
          <div
            style={{
              background: '#14181f',
              color: '#ffffff',
              fontSize: '8.5pt',
              paddingLeft: '3mm',
              paddingRight: '3mm',
              height: '6mm',
              display: 'flex',
              alignItems: 'center',
              fontFamily: FONT_SERIF,
            }}
          >
            Cadre réservé à l'agence
          </div>
          <div style={{ position: 'relative', height: 'calc(100% - 6mm)' }}>
            <div style={{ position: 'absolute', left: '3mm', top: '4mm', fontSize: '9pt', color: INK }}>
              {form.agencyBoxBlocage}
            </div>
            <div style={{ position: 'absolute', left: '3mm', top: '11mm', fontSize: '9pt', color: INK }}>
              {form.agencyBoxControle}
            </div>
            <div style={{ position: 'absolute', right: '3mm', top: '4mm', fontSize: '9pt', color: INK }}>
              {form.agencyBoxBonAOperer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
