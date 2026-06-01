import { useMemo, useRef, useState } from 'react';

export interface SearchableOption {
  id: string;
  label: string;
  sublabel?: string;
  /** Termos extras de busca: nome PT, path, aliases, siglas. */
  keywords?: string[];
}

interface Props {
  options: SearchableOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

// Normaliza para busca tolerante: minusculo, sem acento, & -> n (dnd acha D&D),
// remove o resto. Assim "dnd" casa com alias "D&D".
const norm = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'n')
    .replace(/[^a-z0-9]/g, '');

export const SearchableSelect = ({ options, value, onChange, placeholder }: Props) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = options.find((o) => o.id === value) || null;

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return options.slice(0, 50);
    const scored = options
      .map((o) => {
        const hayParts = [o.label, o.sublabel ?? '', ...(o.keywords ?? [])];
        const hay = hayParts.map(norm);
        const idx = hay.findIndex((h) => h.includes(q));
        if (idx === -1) return null;
        // prioriza match no inicio do label
        const startsLabel = hay[0].startsWith(q) ? 0 : 1;
        return { o, rank: startsLabel * 10 + idx };
      })
      .filter((x): x is { o: SearchableOption; rank: number } => x !== null)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 50);
    return scored.map((s) => s.o);
  }, [options, query]);

  const pick = (opt: SearchableOption) => {
    onChange(opt.id);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative mt-1">
      <input
        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
        value={open ? query : selected?.label ?? ''}
        placeholder={selected ? selected.label : placeholder ?? 'Buscar…'}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && filtered[0]) {
            e.preventDefault();
            pick(filtered[0]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#1B2A4A] shadow-2xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-white/50 text-sm">Nenhum resultado</div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onMouseDown={(e) => {
                  // mousedown antes do blur fechar
                  e.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  pick(o);
                }}
                className={`block w-full text-left px-3 py-2 text-sm hover:bg-white/10 ${
                  o.id === value ? 'bg-blue-600/20 text-white' : 'text-white/80'
                }`}
              >
                <span className="block truncate">{o.label}</span>
                {o.sublabel && <span className="block text-white/40 text-xs truncate">{o.sublabel}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
