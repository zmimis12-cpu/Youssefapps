import type { Currency } from '../types';
import { currencies as currencyList } from '../data/currencies';

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

interface CurrencyWords {
  one: string;
  many: string;
  centOne: string;
  centMany: string;
  feminine?: boolean; // "une" au lieu de "un" devant le nom de la devise
}

// Noms précis pour les devises les plus utilisées. Pour toutes les autres devises
// ISO 4217 (voir src/data/currencies.ts), un nom est dérivé automatiquement.
const CURRENCY_NAMES: Record<string, CurrencyWords> = {
  MAD: { one: 'dirham', many: 'dirhams', centOne: 'centime', centMany: 'centimes' },
  USD: { one: 'dollar américain', many: 'dollars américains', centOne: 'cent', centMany: 'cents' },
  EUR: { one: 'euro', many: 'euros', centOne: 'centime', centMany: 'centimes' },
  GBP: { one: 'livre sterling', many: 'livres sterling', centOne: 'penny', centMany: 'pence', feminine: true },
  CNY: { one: 'yuan', many: 'yuans', centOne: 'fen', centMany: 'fen' },
  CHF: { one: 'franc suisse', many: 'francs suisses', centOne: 'centime', centMany: 'centimes' },
  JPY: { one: 'yen', many: 'yens', centOne: 'sen', centMany: 'sen' },
  CAD: { one: 'dollar canadien', many: 'dollars canadiens', centOne: 'cent', centMany: 'cents' },
  AUD: { one: 'dollar australien', many: 'dollars australiens', centOne: 'cent', centMany: 'cents' },
  AED: { one: 'dirham des Émirats arabes unis', many: 'dirhams des Émirats arabes unis', centOne: 'fils', centMany: 'fils' },
  SAR: { one: 'riyal saoudien', many: 'riyals saoudiens', centOne: 'halala', centMany: 'halalas' },
  XOF: { one: 'franc CFA', many: 'francs CFA', centOne: 'centime', centMany: 'centimes' },
  XAF: { one: 'franc CFA', many: 'francs CFA', centOne: 'centime', centMany: 'centimes' },
  TRY: { one: 'livre turque', many: 'livres turques', centOne: 'kurus', centMany: 'kurus', feminine: true },
  RUB: { one: 'rouble russe', many: 'roubles russes', centOne: 'kopeck', centMany: 'kopecks' },
  INR: { one: 'roupie indienne', many: 'roupies indiennes', centOne: 'paisa', centMany: 'paisas', feminine: true },
  BRL: { one: 'réal brésilien', many: 'réaux brésiliens', centOne: 'centavo', centMany: 'centavos' },
  ZAR: { one: 'rand', many: 'rands', centOne: 'cent', centMany: 'cents' },
  HKD: { one: 'dollar de Hong Kong', many: 'dollars de Hong Kong', centOne: 'cent', centMany: 'cents' },
  SGD: { one: 'dollar de Singapour', many: 'dollars de Singapour', centOne: 'cent', centMany: 'cents' },
};

function guessGender(name: string): boolean {
  // Heuristique simple : les noms de devise se terminant par "e" (livre, couronne,
  // roupie, gourde…) sont le plus souvent féminins en français.
  const first = name.split(' ')[0];
  return /e$/i.test(first);
}

function pluralize(name: string): string {
  return name
    .split(' ')
    .map((w, i) => (i === 0 && !/[sxz]$/i.test(w) ? `${w}s` : w))
    .join(' ');
}

function namesForCurrency(code: string): CurrencyWords {
  const explicit = CURRENCY_NAMES[code];
  if (explicit) return explicit;

  const info = currencyList.find((c) => c.code === code);
  if (info) {
    const one = info.name.toLowerCase();
    return {
      one,
      many: pluralize(one),
      centOne: 'centime',
      centMany: 'centimes',
      feminine: guessGender(one),
    };
  }

  // Devise inconnue : repli générique sur le code ISO.
  return { one: `unité ${code}`, many: `unités ${code}`, centOne: 'centime', centMany: 'centimes' };
}

export function amountToWords(amount: number, currency: Currency): string {
  if (Number.isNaN(amount)) return '';
  const rounded = Math.round(amount * 100) / 100;
  const wholePart = Math.floor(rounded);
  const centsPart = Math.round((rounded - wholePart) * 100);

  const names = namesForCurrency(currency);
  let wholeWords = integerToWords(wholePart);
  if (names.feminine && /\bun$/.test(wholeWords)) {
    wholeWords = wholeWords.replace(/\bun$/, 'une');
  }
  const wholeLabel = wholePart <= 1 ? names.one : names.many;

  let result = `${capitalize(wholeWords)} ${wholeLabel}`;

  if (centsPart > 0) {
    const centWords = integerToWords(centsPart);
    const centLabel = centsPart <= 1 ? names.centOne : names.centMany;
    result += ` et ${centWords} ${centLabel}`;
  }

  return result;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
