import type { Currency } from '../types';
import { amountToWords } from '../utils/amountToWords';
import { parseAmount } from '../utils/formatAmount';

interface Props {
  amount: string;
  currency: Currency;
}

export default function AmountToWords({ amount, currency }: Props) {
  const num = parseAmount(amount || '');
  const valid = amount.trim() !== '' && !Number.isNaN(num) && num > 0;
  const words = valid ? amountToWords(num, currency) : '';

  return (
    <div className="rounded-md border border-ink-100 bg-ink-50 px-3 py-2">
      <span className="text-[11px] font-medium text-ink-500">Montant en lettres</span>
      <p className="mt-0.5 text-sm text-ink-900 min-h-[1.25rem]">
        {words || <span className="text-ink-500 italic">Saisissez un montant…</span>}
      </p>
    </div>
  );
}
