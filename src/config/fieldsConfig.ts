// Toutes les coordonnées sont exprimées en millimètres (mm) sur une feuille A4
// de 210mm x 297mm. (0,0) = coin supérieur gauche.
// Modifier x / y / width / fontSize ici pour ajuster la position d'un champ
// sans toucher au composant A4Preview.

export interface FieldPos {
  x: number;
  y: number;
  width: number;
  fontSize: number; // pt
  align?: 'left' | 'center' | 'right';
}

export const fields: Record<string, FieldPos> = {
  orderAccountNumber: { x: 62, y: 47, width: 68, fontSize: 12 },
  orderName: { x: 62, y: 40, width: 68, fontSize: 10.5 },

  currency: { x: 55, y: 82.5, width: 45, fontSize: 10.5 },
  amountDigits: { x: 140, y: 82.5, width: 55, fontSize: 10 },
  amountWords: { x: 15, y: 94, width: 180, fontSize: 9.5 },

  beneficiaryName: { x: 62, y: 114.5, width: 130, fontSize: 10.5 },
  beneficiaryCountry: { x: 35, y: 120.5, width: 100, fontSize: 10 },
  beneficiaryAccountNumber: { x: 62, y: 126.5, width: 130, fontSize: 10 },
  beneficiaryBank: { x: 62, y: 132.5, width: 130, fontSize: 10 },

  invoiceRef: { x: 68, y: 150, width: 125, fontSize: 10 },

  importTitle: { x: 62, y: 172, width: 130, fontSize: 10 },
  references: { x: 49, y: 178, width: 48, fontSize: 10 },
  domicileChez: { x: 138, y: 178, width: 57, fontSize: 10 },
  changeOfficeAuth: { x: 74, y: 184, width: 68, fontSize: 10 },
  authDate: { x: 160, y: 184, width: 35, fontSize: 10 },

  cityDate: { x: 15, y: 197, width: 100, fontSize: 11 },
};
