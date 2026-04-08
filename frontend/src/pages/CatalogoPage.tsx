import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, RotateCcw, Search, ShieldCheck, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableCardComponent, TableCardSkeleton } from '../components/TableCard';
import type { CatalogSeal, TableCard, TablesResponse } from '../types/tables';
import { applySeo } from '../utils/seo';

interface SystemOption {
  id: string;
  name: string;
  slug: string;
}

export const CatalogoPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // STATE
  const [systems, setSystems] = useState<SystemOption[]>([]);
  const [tables, setTables] = useState<TableCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [system, setSystem] = useState('');
  const [modality, setModality] = useState('');
  const [priceType, setPriceType] = useState('');
  const [experience, setExperience] = useState('');
  const [seal, setSeal] = useState<CatalogSeal>('');
  const [styles, setStyles] = useState<string[]>([]); // NOVO: Filtro de estilos
  const [sort, setSort] = useState('popular'); // CORREÇÃO: Padrão = popular (ranking inteligente)
  const [page, setPage] = useState(1);

  // CACHE + DEDUP
  const cache = useRef<Record<string, TableCard[]>>({});
  const prevQueryRef = useRef('');

  // SEO
  useEffect(() => {
    applySeo(
      'Catálogo de Mesas | Artifício Mesas',
      'Explore mesas de RPG com filtros por sistema, modalidade, preço, nível de experiência e selos DDAL/Covil do Lich.'
    );
  }, []);

  // LOAD SYSTEMS
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

  // INIT FROM URL
  useEffect(() => {
    const initialSearch = searchParams.get('search') || '';
    const initialSystem = searchParams.get('system') || '';
    const initialModality = searchParams.get('modality') || '';
    const initialPriceType = searchParams.get('price_type') || '';
    const initialExperience = searchParams.get('experience_level') || '';
    const initialSeal = (searchParams.get('seal') || '') as CatalogSeal;
    const initialStyles = searchParams.get('styles')?.split(',').filter(Boolean) || [];
    const initialSort = searchParams.get('sort') || 'popular';
    const initialPage = parseInt(searchParams.get('page') || '1');

    setSearchInput(initialSearch);
    setDebouncedSearch(initialSearch);
    setSystem(initialSystem);
    setModality(initialModality);
    setPriceType(initialPriceType);
    setExperience(initialExperience);
    setSeal(initialSeal);
    setStyles(initialStyles);
    setSort(initialSort);
    setPage(initialPage);
  }, []);

  // DEBOUNCE SEARCH (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1); // Reset page on search
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // BUILD QUERY STRING
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    
    params.set('limit', '24');
    params.set('page', page.toString());

    if (debouncedSearch) params.set('search', debouncedSearch);
    if (system) params.set('system', system);
    if (modality) params.set('modality', modality);
    if (priceType) params.set('price_type', priceType);
    if (experience) params.set('experience_level', experience);
    if (seal) params.set('seal', seal);
    if (styles.length > 0) params.set('styles', styles.join(','));
    if (sort) params.set('sort', sort);

    return params.toString();
  }, [debouncedSearch, system, modality, priceType, experience, seal, styles, sort, page]);

  // SYNC URL (debounced to avoid excessive history pollution)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();

      if (debouncedSearch) params.set('search', debouncedSearch);
      if (system) params.set('system', system);
      if (modality) params.set('modality', modality);
      if (priceType) params.set('price_type', priceType);
      if (experience) params.set('experience_level', experience);
      if (seal) params.set('seal', seal);
      if (styles.length > 0) params.set('styles', styles.join(','));
      if (sort) params.set('sort', sort);
      if (page > 1) params.set('page', page.toString());

      setSearchParams(params, { replace: true });
    }, 100);

    return () => clearTimeout(timer);
  }, [debouncedSearch, system, modality, priceType, experience, seal, styles, sort, page, setSearchParams]);

  // SCROLL TO TOP (only on filter change, not pagination)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [debouncedSearch, system, modality, priceType, experience, seal, sort]);

  // FETCH TABLES + CACHE
  useEffect(() => {
    // Dedup: avoid refetch if query hasn't changed
    if (prevQueryRef.current === queryString) return;
    prevQueryRef.current = queryString;

    const controller = new AbortController();

    const loadTables = async () => {
      // Check cache first
      if (cache.current[queryString]) {
        setTables(cache.current[queryString]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/tables?${queryString}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: TablesResponse = await res.json();
        
        // Cache result
        cache.current[queryString] = json.data ?? [];
        setTables(json.data ?? []);
        
        // Calculate total pages from pagination
        const total = json.pagination?.total ?? json.data?.length ?? 0;
        setTotalPages(Math.ceil(total / 24) || 1);
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

  // CLEAR FILTERS
  const clearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSystem('');
    setModality('');
    setPriceType('');
    setExperience('');
    setSeal('');
    setStyles([]);
    setSort('popular');
    setPage(1);
    cache.current = {}; // Clear cache on filter reset
  };

  // ACTIVE FILTERS COUNT
  const activeFiltersCount = useMemo(() => {
    return [
      debouncedSearch,
      system,
      modality,
      priceType,
      experience,
      seal,
      styles.length > 0 ? 'styles' : '',
      sort !== 'popular' ? sort : '', // Não contar sort padrão
    ].filter((value) => value !== '' && value !== null && value !== undefined).length;
  }, [debouncedSearch, system, modality, priceType, experience, seal, styles, sort]);

  // PAGINATION HANDLERS
  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <main className="bg-[var(--color-artificio-blue)] text-white min-h-screen">
      <section className="container mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">Catálogo Público de Mesas</h1>
        <p className="text-white/65 max-w-2xl">
          Filtre por sistema, modalidade, nível e selos para encontrar a aventura ideal para seu grupo.
        </p>
      </section>

      <section className="container mx-auto px-6 pb-16 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        {/* SIDEBAR */}
        <aside className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--color-artificio-orange)]" />
              Filtros
            </h2>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* SEARCH */}
            <div>
              <label htmlFor="catalogo-search" className="block text-xs uppercase tracking-wider text-white/60 mb-1">
                Busca
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                <input
                  id="catalogo-search"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Título, sistema ou mestre"
                  className="w-full rounded-xl bg-[#13213f] border border-white/10 pl-9 pr-3 py-2.5 outline-none focus:border-[var(--color-artificio-orange)] transition-colors"
                />
              </div>
              {searchInput !== debouncedSearch && (
                <p className="text-xs text-white/40 mt-1">Buscando...</p>
              )}
            </div>

            {/* SEALS */}
            <div>
              <p className="block text-xs uppercase tracking-wider text-white/60 mb-2">Selos</p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setSeal((prev) => (prev === 'ddal' ? '' : 'ddal'))}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                    seal === 'ddal'
                      ? 'border-amber-300/50 bg-amber-500/20 text-amber-100 ring-2 ring-amber-500/30'
                      : 'border-white/10 bg-[#13213f] text-white/80 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> DDAL
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSeal((prev) => (prev === 'covil-do-lich' ? '' : 'covil-do-lich'))}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                    seal === 'covil-do-lich'
                      ? 'border-purple-300/50 bg-purple-500/20 text-purple-100 ring-2 ring-purple-500/30'
                      : 'border-white/10 bg-[#13213f] text-white/80 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Star className="w-4 h-4" /> Covil do Lich
                  </span>
                </button>
              </div>
            </div>

            {/* STYLES */}
            <div>
              <p className="block text-xs uppercase tracking-wider text-white/60 mb-2">Estilos de Jogo</p>
              <div className="flex flex-wrap gap-2">
                {['Narrativo', 'Combate intenso', 'Investigação', 'Roleplay pesado', 'Sandbox', 'Horror'].map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => {
                      setStyles((prev) =>
                        prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
                      );
                      setPage(1); // Reset page on filter change
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                      styles.includes(style)
                        ? 'border-orange-500 bg-orange-500/20 text-orange-100 ring-2 ring-orange-500/30'
                        : 'border-white/10 bg-[#13213f] text-white/70 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* SYSTEM */}
            <div>
              <label htmlFor="catalogo-system" className="block text-xs uppercase tracking-wider text-white/60 mb-1">
                Sistema
              </label>
              <select
                id="catalogo-system"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                className="w-full rounded-xl bg-[#13213f] border border-white/10 px-3 py-2.5 outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
              >
                <option value="">Todos os sistemas</option>
                {systems.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* MODALITY */}
            <div>
              <label htmlFor="catalogo-modality" className="block text-xs uppercase tracking-wider text-white/60 mb-1">
                Modalidade
              </label>
              <select
                id="catalogo-modality"
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                className="w-full rounded-xl bg-[#13213f] border border-white/10 px-3 py-2.5 outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
              >
                <option value="">Todas</option>
                <option value="online">Online</option>
                <option value="presencial">Presencial</option>
                <option value="hibrida">Híbrida</option>
              </select>
            </div>

            {/* PRICE */}
            <div>
              <label htmlFor="catalogo-price" className="block text-xs uppercase tracking-wider text-white/60 mb-1">
                Preço
              </label>
              <select
                id="catalogo-price"
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
                className="w-full rounded-xl bg-[#13213f] border border-white/10 px-3 py-2.5 outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
              >
                <option value="">Todos</option>
                <option value="gratuita">Gratuita</option>
                <option value="paga">Paga</option>
              </select>
            </div>

            {/* EXPERIENCE */}
            <div>
              <label htmlFor="catalogo-experience" className="block text-xs uppercase tracking-wider text-white/60 mb-1">
                Nível
              </label>
              <select
                id="catalogo-experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-xl bg-[#13213f] border border-white/10 px-3 py-2.5 outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
              >
                <option value="">Todos os níveis</option>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="veterano">Veterano</option>
              </select>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <div>
          {/* HEADER: Results count + Sort */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {!isLoading && (
                <span className="text-sm font-semibold text-white">
                  {tables.length} {tables.length === 1 ? 'mesa encontrada' : 'mesas encontradas'}
                </span>
              )}
              {activeFiltersCount > 0 && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-sm text-white/70">
                    {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-orange-400 hover:text-orange-300 hover:underline text-sm transition-colors"
                  >
                    Limpar todos
                  </button>
                </>
              )}
            </div>

            {/* SORT */}
            <select
              id="catalogo-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl bg-[#13213f] border border-white/10 px-3 py-2 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
            >
              <option value="popular">Mais relevantes</option>
              <option value="recent">Mais recentes</option>
              <option value="slots">Mais vagas</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
            </select>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
              {error}
            </div>
          )}

          {/* EMPTY STATE */}
          {!isLoading && tables.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 py-20 text-center">
              <p className="text-lg text-white/70 mb-2">Nenhuma mesa encontrada com esses filtros 🔍</p>
              <p className="text-sm text-white/50 mb-4">Tente remover alguns filtros ou ajustar sua busca</p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          ) : (
            <>
              {/* GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {isLoading
                  ? Array.from({ length: 9 }).map((_, idx) => <TableCardSkeleton key={idx} />)
                  : tables.map((table) => <TableCardComponent key={table.id} table={table} />)}
              </div>

              {/* PAGINATION */}
              {!isLoading && tables.length > 0 && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`min-w-[40px] h-10 rounded-lg border transition-colors ${
                            page === pageNum
                              ? 'border-orange-500 bg-orange-500 text-white font-semibold'
                              : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Próxima página"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
};
