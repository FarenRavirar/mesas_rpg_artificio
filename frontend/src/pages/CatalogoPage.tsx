import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Filter, RotateCcw, Search } from 'lucide-react';
import { TableCardComponent, TableCardSkeleton } from '../components/TableCard';
import type { TableCard, TablesResponse } from '../types/tables';
import { applySeo } from '../utils/seo';

interface SystemOption {
  id: string;
  name: string;
  slug: string;
}

export const CatalogoPage = () => {
  const [systems, setSystems] = useState<SystemOption[]>([]);
  const [tables, setTables] = useState<TableCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [system, setSystem] = useState('');
  const [modality, setModality] = useState('');
  const [priceType, setPriceType] = useState('');
  const [experience, setExperience] = useState('');

  useEffect(() => {
    applySeo(
      'Catálogo de Mesas | Artifício Mesas',
      'Explore mesas de RPG com filtros por sistema, modalidade, preço e nível de experiência.'
    );
  }, []);

  useEffect(() => {
    const loadSystems = async () => {
      try {
        const res = await fetch('/api/v1/systems');
        if (!res.ok) throw new Error('Erro ao carregar sistemas');
        const json = await res.json();
        setSystems(json.data ?? []);
      } catch (err) {
        console.error('[CatalogoPage] systems', err);
      }
    };

    loadSystems();
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('limit', '24');

    if (search) params.set('search', search);
    if (system) params.set('system', system);
    if (modality) params.set('modality', modality);
    if (priceType) params.set('price_type', priceType);
    if (experience) params.set('experience_level', experience);

    return params.toString();
  }, [experience, modality, priceType, search, system]);

  useEffect(() => {
    const controller = new AbortController();

    const loadTables = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/tables?${queryString}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: TablesResponse = await res.json();
        setTables(json.data ?? []);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError('Não foi possível carregar o catálogo no momento.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTables();
    return () => controller.abort();
  }, [queryString]);

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setSystem('');
    setModality('');
    setPriceType('');
    setExperience('');
  };

  return (
    <main className="min-h-screen bg-[var(--color-artificio-blue)] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#102041]/90 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-[var(--color-artificio-orange)]" id="catalogo-link-home">
            <Compass className="w-5 h-5" />
            <span>Artifício Mesas</span>
          </Link>
          <Link to="/painel" className="text-sm text-white/70 hover:text-white transition-colors" id="catalogo-link-painel">
            Painel do Mestre
          </Link>
        </div>
      </header>

      <section className="container mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Catálogo Público de Mesas</h1>
        <p className="text-white/65 max-w-2xl">Filtre por sistema, modalidade e nível para encontrar a aventura ideal para seu grupo.</p>
      </section>

      <section className="container mx-auto px-6 pb-16 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        <aside className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--color-artificio-orange)]" />
              Filtros
            </h2>
            <button
              id="catalogo-clear-filters"
              onClick={clearFilters}
              className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Limpar
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="catalogo-search" className="block text-xs uppercase tracking-wider text-white/60 mb-1">Busca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  id="catalogo-search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setSearch(searchInput.trim())}
                  placeholder="Título, sistema ou mestre"
                  className="w-full rounded-xl bg-[#13213f] border border-white/10 pl-9 pr-3 py-2.5 outline-none focus:border-[var(--color-artificio-orange)]"
                />
              </div>
              <button
                id="catalogo-search-submit"
                onClick={() => setSearch(searchInput.trim())}
                className="mt-2 w-full py-2 rounded-lg bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] transition-colors text-sm font-semibold"
              >
                Buscar
              </button>
            </div>

            <div>
              <label htmlFor="catalogo-system" className="block text-xs uppercase tracking-wider text-white/60 mb-1">Sistema</label>
              <select
                id="catalogo-system"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                className="w-full rounded-xl bg-[#13213f] border border-white/10 px-3 py-2.5 outline-none focus:border-[var(--color-artificio-orange)]"
              >
                <option value="">Todos</option>
                {systems.map((item) => (
                  <option key={item.id} value={item.slug}>{item.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="catalogo-modality" className="block text-xs uppercase tracking-wider text-white/60 mb-1">Modalidade</label>
              <select
                id="catalogo-modality"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="w-full rounded-xl bg-[#13213f] border border-white/10 px-3 py-2.5 outline-none focus:border-[var(--color-artificio-orange)]"
              >
                <option value="">Todas</option>
                <option value="online">Online</option>
                <option value="presencial">Presencial</option>
                <option value="hibrida">Híbrida</option>
              </select>
            </div>

            <div>
              <label htmlFor="catalogo-price" className="block text-xs uppercase tracking-wider text-white/60 mb-1">Preço</label>
              <select
                id="catalogo-price"
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
                className="w-full rounded-xl bg-[#13213f] border border-white/10 px-3 py-2.5 outline-none focus:border-[var(--color-artificio-orange)]"
              >
                <option value="">Todos</option>
                <option value="gratuita">Gratuita</option>
                <option value="paga">Paga</option>
              </select>
            </div>

            <div>
              <label htmlFor="catalogo-experience" className="block text-xs uppercase tracking-wider text-white/60 mb-1">Nível</label>
              <select
                id="catalogo-experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-xl bg-[#13213f] border border-white/10 px-3 py-2.5 outline-none focus:border-[var(--color-artificio-orange)]"
              >
                <option value="">Todos</option>
                <option value="todos">Todos</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="veterano">Veterano</option>
              </select>
            </div>
          </div>
        </aside>

        <div>
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200" id="catalogo-error">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {isLoading
              ? Array.from({ length: 9 }).map((_, idx) => <TableCardSkeleton key={idx} />)
              : tables.length > 0
                ? tables.map((table) => <TableCardComponent key={table.id} table={table} />)
                : (
                  <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 py-14 text-center text-white/60">
                    Nenhuma mesa encontrada com os filtros atuais.
                  </div>
                )}
          </div>
        </div>
      </section>
    </main>
  );
};
