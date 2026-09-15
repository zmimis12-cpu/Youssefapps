import type { Currency } from '../types';
import { writtenLabelFor } from '../data/currencies';

const UNITS = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
  'dix-sept', 'dix-huit', 'dix-neuf',
];

const TENS = [
  '', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix',
];

function twoDigits(n: number): string {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;

  if (t === 7 || t === 9) {
    // soixante-dix / quatre-vingt-dix families use 10-19 offset
    const base = TENS[t - 1]; // soixante or quatre-vingt
    const rem = 10 + u;
    if (u === 1 && t === 7) return `${base}-et-onze`;
    return `${base}-${UNITS[rem]}`;
  }

  if (u === 0) return TENS[t];
  if (u === 1 && (t === 2 || t === 3 || t === 4 || t === 5 || t === 6)) return `${TENS[t]}-et-un`;
  return `${TENS[t]}-${UNITS[u]}`;
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rem = n % 100;
  let out = '';
  if (h > 0) {
    out += h === 1 ? 'cent' : `${UNITS[h]} cent`;
    // "cents" takes an 's' only when exactly a multiple of 100 AND it's the last group
    if (rem === 0 && h > 1) out += 's';
    if (rem > 0) out += ' ';
  }
  if (rem > 0) {
    out += twoDigits(rem);
  }
  if (!out) out = 'zéro';
  return out;
}

function integerToWords(n: number): string {
  if (n === 0) return 'zéro';

  const groups: number[] = [];
  let x = n;
  while (x > 0) {
    groups.push(x % 1000);
    x = Math.floor(x / 1000);
  }
  // groups[0] = units, [1] = thousands, [2] = millions, [3] = milliards

  const scaleWord = (idx: number, value: number) => {
    if (idx === 0) return '';
    if (idx === 1) return value === 1 ? 'mille' : 'mille';
    if (idx === 2) return value === 1 ? 'million' : 'millions';
    if (idx === 3) return value === 1 ? 'milliard' : 'milliards';
    return '';
  };

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const value = groups[i];
    if (value === 0) continue;
    let words: string;
    if (i === 1 && value === 1) {
      words = 'mille'; // "mille" not "un mille"
    } else {
      words = threeDigits(value);
      const scale = scaleWord(i, value);
      if (scale) words = `${words} ${scale}`;
    }
    parts.push(words);
  }
  return parts.join(' ');
}

// Nom des sous-unités (centimes / cents / pence…) pour les devises les plus
// utilisées. Repli générique sur "centime(s)" pour les autres — cohérent avec
// l'usage marocain courant quelle que soit la devise du virement.
const CENT_NAMES: Record<string, { one: string; many: string }> = {
  USD: { one: 'cent', many: 'cents' },
  CAD: { one: 'cent', many: 'cents' },
  AUD: { one: 'cent', many: 'cents' },
  ZAR: { one: 'cent', many: 'cents' },
  HKD: { one: 'cent', many: 'cents' },
  SGD: { one: 'cent', many: 'cents' },
  GBP: { one: 'penny', many: 'pence' },
  CNY: { one: 'fen', many: 'fen' },
  AED: { one: 'fils', many: 'fils' },
  SAR: { one: 'halala', many: 'halalas' },
  TRY: { one: 'kurus', many: 'kurus' },
  RUB: { one: 'kopeck', many: 'kopecks' },
  INR: { one: 'paisa', many: 'paisas' },
  BRL: { one: 'centavo', many: 'centavos' },
};

function centNames(code: string): { one: string; many: string } {
  return CENT_NAMES[code] ?? { one: 'centime', many: 'centimes' };
}

// Le nom de la devise n'est plus tissé dans la phrase (pas de "un euro",
// "cent dirhams"…) : il est toujours ajouté une seule fois, en toutes
// lettres et en majuscules, à la toute fin — comme sur le formulaire papier
// où "DOLLAR USA" est écrit une fois après le montant.
export function amountToWords(amount: number, currency: Currency): string {
  if (Number.isNaN(amount)) return '';
  const rounded = Math.round(amount * 100) / 100;
  const wholePart = Math.floor(rounded);
  const centsPart = Math.round((rounded - wholePart) * 100);

  const cents = centNames(currency);
  const wholeWords = integerToWords(wholePart);

  let result = capitalize(wholeWords);

  if (centsPart > 0) {
    const centWords = integerToWords(centsPart);
    const centLabel = centsPart <= 1 ? cents.one : cents.many;
    result += ` et ${centWords} ${centLabel}`;
  }

  result += ` ${writtenLabelFor(currency)}`;

  return result;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
