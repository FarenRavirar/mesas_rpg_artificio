import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw, Search, ShieldCheck, Star, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { TableCardComponent, TableCardSkeleton } from '../components/TableCard';
import { FilterDrawer } from '../components/FilterDrawer';
import { ActiveFiltersChips } from '../components/ActiveFiltersChips';
import { ResultsHeader } from '../components/ResultsHeader';
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
  const [sort, setSort] = useState('popular'); // CORREÇÃO UX-01: Padrão = popular, mas não forçar na URL
  const [page, setPage] = useState(1);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false); // Drawer mobile

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
    // CORREÇÃO UX-01: Só adicionar sort na URL se for diferente do padrão
    if (sort && sort !== 'popular') params.set('sort', sort);

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

  // REMOVE INDIVIDUAL FILTER
  const removeFilter = (key: string, value?: string) => {
    switch (key) {
      case 'search':
        setSearchInput('');
        setDebouncedSearch('');
        break;
      case 'system':
        setSystem('');
        break;
      case 'modality':
        setModality('');
        break;
      case 'priceType':
        setPriceType('');
        break;
      case 'experience':
        setExperience('');
        break;
      case 'seal':
        setSeal('');
        break;
      case 'styles':
        if (value) {
          setStyles((prev) => prev.filter((s) => s !== value));
        }
        break;
      case 'sort':
        setSort('popular');
        break;
    }
    setPage(1);
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

  // GET SYSTEM NAME
  const selectedSystemName = useMemo(() => {
    return systems.find((s) => s.slug === system)?.name;
  }, [systems, system]);

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

      {/* BARRA DE FILTROS - DESKTOP */}
      <div className="hidden md:block sticky top-16 z-30 bg-[#0d1a30]/95 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          {/* ZONA 1: Busca + Limpar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar mesas..."
                className="w-full rounded-lg bg-[#13213f] border border-white/10 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors"
              />
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 text-sm text-white font-semibold transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" /> Limpar filtros
              </button>
            )}
          </div>

          {/* ZONA 2: Filtros principais em grid */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <select
              value={system}
              onChange={(e) => setSystem(e.target.value)}
              className="rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
            >
              <option value="">Todos os sistemas</option>
              {systems.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              className="rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
            >
              <option value="">Modalidade</option>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
              <option value="hibrida">Híbrida</option>
            </select>

            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value)}
              className="rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
            >
              <option value="">Preço</option>
              <option value="gratuita">Gratuita</option>
              <option value="paga">Paga</option>
            </select>

            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
            >
              <option value="">Nível</option>
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="veterano">Veterano</option>
            </select>
          </div>

          {/* ZONA 3: Selos + Estilos */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSeal((prev) => (prev === 'ddal' ? '' : 'ddal'))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all whitespace-nowrap ${
                seal === 'ddal'
                  ? 'border-amber-300/50 bg-amber-500/20 text-amber-100'
                  : 'border-white/10 bg-[#13213f] text-white/70 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> DDAL
            </button>

            <button
              type="button"
              onClick={() => setSeal((prev) => (prev === 'covil-do-lich' ? '' : 'covil-do-lich'))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all whitespace-nowrap ${
                seal === 'covil-do-lich'
                  ? 'border-purple-300/50 bg-purple-500/20 text-purple-100'
                  : 'border-white/10 bg-[#13213f] text-white/70 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <Star className="w-3.5 h-3.5" /> Covil do Lich
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            {['Narrativo', 'Combate intenso', 'Investigação', 'Roleplay pesado', 'Sandbox', 'Horror'].map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => {
                  setStyles((prev) =>
                    prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
                  );
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-all whitespace-nowrap ${
                  styles.includes(style)
                    ? 'border-orange-500 bg-orange-500/20 text-orange-100'
                    : 'border-white/10 bg-[#13213f] text-white/70 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BOTÃO FILTROS - MOBILE */}
      <button
        onClick={() => setIsFilterOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] text-white font-bold shadow-lg transition-colors"
      >
        <SlidersHorizontal className="w-5 h-5" />
        Filtros
        {activeFiltersCount > 0 && (
          <span className="bg-white text-[var(--color-artificio-orange)] rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* DRAWER MOBILE */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onClear={clearFilters}
      >
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar mesas..."
            className="w-full rounded-lg bg-[#13213f] border border-white/10 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors"
          />
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <select
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            className="w-full rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
          >
            <option value="">Todos os sistemas</option>
            {systems.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={modality}
            onChange={(e) => setModality(e.target.value)}
            className="w-full rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
          >
            <option value="">Modalidade</option>
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
            <option value="hibrida">Híbrida</option>
          </select>

          <select
            value={priceType}
            onChange={(e) => setPriceType(e.target.value)}
            className="w-full rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
          >
            <option value="">Preço</option>
            <option value="gratuita">Gratuita</option>
            <option value="paga">Paga</option>
          </select>

          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
          >
            <option value="">Nível</option>
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="veterano">Veterano</option>
          </select>
        </div>

        {/* Selos */}
        <div>
          <p className="text-xs text-white/50 mb-2 font-semibold">Selos</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSeal((prev) => (prev === 'ddal' ? '' : 'ddal'))}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                seal === 'ddal'
                  ? 'border-amber-300/50 bg-amber-500/20 text-amber-100'
                  : 'border-white/10 bg-[#13213f] text-white/70'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> DDAL
            </button>

            <button
              type="button"
              onClick={() => setSeal((prev) => (prev === 'covil-do-lich' ? '' : 'covil-do-lich'))}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                seal === 'covil-do-lich'
                  ? 'border-purple-300/50 bg-purple-500/20 text-purple-100'
                  : 'border-white/10 bg-[#13213f] text-white/70'
              }`}
            >
              <Star className="w-3.5 h-3.5" /> Covil
            </button>
          </div>
        </div>

        {/* Estilos */}
        <div>
          <p className="text-xs text-white/50 mb-2 font-semibold">Estilos</p>
          <div className="flex flex-wrap gap-2">
            {['Narrativo', 'Combate intenso', 'Investigação', 'Roleplay pesado', 'Sandbox', 'Horror'].map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => {
                  setStyles((prev) =>
                    prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
                  );
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                  styles.includes(style)
                    ? 'border-orange-500 bg-orange-500/20 text-orange-100'
                    : 'border-white/10 bg-[#13213f] text-white/70'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>
      </FilterDrawer>

      {/* CONTEÚDO */}
      <section className="container mx-auto px-6 py-8">
        {/* LINHA DE CONTEXTO */}
        <div className="mb-6 space-y-4">
          <ResultsHeader
            count={tables.length}
            sort={sort}
            onSortChange={setSort}
            isLoading={isLoading}
          />

          {/* CHIPS DE FILTROS ATIVOS */}
          <ActiveFiltersChips
            filters={{
              search: debouncedSearch,
              system,
              modality,
              priceType,
              experience,
              seal,
              styles,
              sort,
            }}
            systemName={selectedSystemName}
            onRemove={removeFilter}
          />
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-sm font-semibold transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && tables.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-20 text-center">
            <div className="text-6xl mb-4 opacity-30">🔍</div>
            <p className="text-xl font-bold text-white mb-2">Nenhuma mesa encontrada</p>
            <p className="text-sm text-white/50 mb-6">Tente ajustar os filtros ou fazer uma nova busca</p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </section>
    </main>
  );
};
