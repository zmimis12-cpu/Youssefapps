export type OperationType = 'SWIFT' | 'TELEX' | 'CHEQUE';
export type Currency = string; // ISO 4217 code, e.g. 'MAD', 'USD', 'EUR'…

export interface Supplier {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  accountNumber: string;
  bankName: string;
  swift?: string;
  notes?: string;
}

export interface OwnAccount {
  id: string;
  name: string; // Nom / raison sociale du donneur d'ordre
  accountNumber: string; // Compte N°
}

export interface TransferForm {
  id: string;
  // Donneur d'ordre
  ownAccountId: string | null;
  orderAccountNumber: string;
  orderName: string;
  // Opération
  operationType: OperationType;
  currency: Currency;
  amount: string; // raw numeric string typed by user
  // Bénéficiaire
  supplierId: string | null;
  beneficiaryName: string;
  beneficiaryAddress: string;
  beneficiaryCity: string;
  beneficiaryCountry: string;
  beneficiaryAccountNumber: string;
  beneficiaryBank: string;
  // Enregistrement
  operationNature: string;
  invoiceRef: string;
  feesOnBeneficiary: 'Oui' | 'Non' | '';
  // Sous couvert de
  importTitle: string;
  references: string;
  domicileChez: string;
  changeOfficeAuth: string;
  authDate: string;
  // Date
  city: string;
  date: string;
  // Apparence du document
  bankHeaderText: string; // logo / nom de banque en en-tête, modifiable ou vidable
  showAgencyBox: boolean;
  agencyBoxLabel: string;
  updatedAt: number;
}

export const emptyForm = (): TransferForm => ({
  id: crypto.randomUUID(),
  ownAccountId: null,
  orderAccountNumber: '',
  orderName: '',
  operationType: 'SWIFT',
  currency: 'MAD',
  amount: '',
  supplierId: null,
  beneficiaryName: '',
  beneficiaryAddress: '',
  beneficiaryCity: '',
  beneficiaryCountry: '',
  beneficiaryAccountNumber: '',
  beneficiaryBank: '',
  operationNature: '',
  invoiceRef: '',
  feesOnBeneficiary: '',
  importTitle: '',
  references: '',
  domicileChez: '',
  changeOfficeAuth: '',
  authDate: '',
  city: 'Casablanca',
  date: new Date().toISOString().slice(0, 10),
  bankHeaderText: 'CIH BANK',
  showAgencyBox: true,
  agencyBoxLabel: "Cadre réservé à l'agence",
  updatedAt: Date.now(),
});
