export function formatAmountDigits(raw: string): string {
  const num = parseFloat(raw.replace(',', '.'));
  if (Number.isNaN(num)) return '';
  return num.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseAmount(raw: string): number {
  return parseFloat(raw.replace(',', '.'));
}
