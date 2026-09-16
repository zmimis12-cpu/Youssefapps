export interface CurrencyInfo {
  code: string;
  name: string; // nom français
  country: string; // pays / zone d'utilisation, pour la recherche
  symbol?: string;
  writtenLabel?: string; // libellé conventionnel tel qu'écrit sur les formulaires bancaires (majuscules)
}

// Liste des devises ISO 4217 actives, avec noms français et pays associé
// pour permettre la recherche par code, nom ou pays.
export const currencies: CurrencyInfo[] = [
  { code: 'USD', name: 'Dollar américain', country: 'États-Unis', symbol: '$', writtenLabel: 'DOLLAR USA' },
];

// Libellé conventionnel de la devise tel qu'on l'écrit à la main sur un
// formulaire bancaire (toujours en majuscules) : utilisé en fin de "Montant
// en chiffres" et de "Montant en lettres". Repli sur le nom français en
// majuscules pour les devises sans libellé explicite ci-dessus.
export function writtenLabelFor(code: string): string {
  const info = currencies.find((c) => c.code === code);
  if (!info) return code;
  return info.writtenLabel ?? info.name.toUpperCase();
}
