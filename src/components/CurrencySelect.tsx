import { useEffect, useMemo, useRef, useState } from 'react';
import { currencies } from '../data/currencies';

interface Props {
  value: string;
  onChange: (code: string) => void;
  error?: boolean;
}

export default function CurrencySelect({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = currencies.find((c) => c.code === value);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return currencies;
    return currencies.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div ref={rootRef} className="relative">
      <span className="text-xs font-medium text-ink-500">
        Devise <span className="text-red-500">*</span>
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`mt-1 flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-sm text-left text-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 ${
          error ? 'border-red-400' : 'border-ink-300 focus:border-teal-500'
        }`}
      >
        <span className="truncate">
          {selected ? `${selected.code} — ${selected.name}` : 'Choisir une devise…'}
        </span>
        <span className="ml-2 shrink-0 text-ink-500">▾</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-ink-100 bg-white shadow-lg">
          <div className="p-2 border-b border-ink-100">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un code, une devise, un pays…"
              className="w-full rounded-md border border-ink-300 px-2.5 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-ink-500">Aucune devise trouvée.</li>
            )}
            {filtered.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-ink-100 ${
                    c.code === value ? 'bg-teal-100/60 text-teal-700' : 'text-ink-900'
                  }`}
                >
                  <span className="truncate">
                    <span className="font-medium">{c.code}</span>
                    <span className="text-ink-500"> — {c.name}</span>
                  </span>
                  <span className="ml-2 shrink-0 text-[11px] text-ink-500">{c.country}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
