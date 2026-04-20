import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw, Search, ShieldCheck, Star, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { TableCardComponent, TableCardSkeleton } from '../components/TableCard';
import { FilterDrawer } from '../components/FilterDrawer';
import { ActiveFiltersChips } from '../components/ActiveFiltersChips';
import { ResultsHeader } from '../components/ResultsHeader';
import { SystemTreeSelector } from '../components/SystemTreeSelector';
import type { CatalogSeal } from '../types/tables';
import type { SystemTreeNode } from '../types/systems';
import { applySeo } from '../utils/seo';
import { useCatalogTables } from '../hooks/useCatalogTables';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import type { StyleOption } from '../services/catalogService';

// Constantes de validação (compartilhadas com parser)
const VALID_STYLES: StyleOption[] = ['Narrativo', 'Combate intenso', 'Investigação', 'Roleplay pesado', 'Sandbox', 'Horror'];

export const CatalogoPage = () => {
  const [searchParams] = useSearchParams();

  // STATE - URL-driven filters (hook genérico)
  const [filters, setFilters] = useCatalogFilters();

  // STATE - Árvore de sistemas e busca
  const [systemsTree, setSystemsTree] = useState<SystemTreeNode[]>([]);
  const [systemsTreeError, setSystemsTreeError] = useState<string | null>(null);
  const [systemsTreeReloadKey, setSystemsTreeReloadKey] = useState(0);
  const [systemSearch, setSystemSearch] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Flatten tree para mapear ID -> slug
  const systemsMap = useMemo(() => {
    const map = new Map<string, string>();
    const flatten = (nodes: SystemTreeNode[]) => {
      for (const node of nodes) {
        map.set(node.id, node.slug);
        if (node.children) flatten(node.children);
      }
    };
    flatten(systemsTree);
    return map;
  }, [systemsTree]);

  // Converter slug do filtro para ID (para SystemTreeSelector)
  const selectedSystemIds = useMemo(() => {
    if (!filters.system) return [];
    const entry = Array.from(systemsMap.entries()).find(([_, slug]) => slug === filters.system);
    return entry ? [entry[0]] : [];
  }, [filters.system, systemsMap]);

  // ============================================================================
  // DATA - React Query
  // ============================================================================
  
  const { tables, pagination, isLoading, isRefreshing, error } = useCatalogTables(filters, searchParams.toString());

  const totalCount = useMemo(() => {
    if (!pagination) return 0;
    if (pagination.total !== undefined) return pagination.total;
    return (filters.page - 1) * 24 + tables.length;
  }, [pagination, filters.page, tables.length]);

  const hasMore = pagination?.hasMore ?? false;

  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const clearFilters = () => {
    setFilters(() => ({
      search: '',
      system: '',
      modality: '',
      priceType: '',
      experience: '',
      seal: '',
      styles: [],
      sort: 'popular',
      page: 1,
      limit: 24,
    }));
  };

  const removeFilter = (key: string, value?: string) => {
    if (key === 'styles' && value) {
      setFilters(prev => ({
        ...prev,
        styles: prev.styles.filter((s) => s !== value),
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: '',
      }));
    }
  };

  const toggleStyle = (style: StyleOption) => {
    setFilters(prev => ({
      ...prev,
      styles: prev.styles.includes(style)
        ? prev.styles.filter((s) => s !== style)
        : [...prev.styles, style],
    }));
  };

  const toggleSeal = (seal: CatalogSeal) => {
    setFilters(prev => ({
      ...prev,
      seal: prev.seal === seal ? '' : seal,
    }));
  };

  const handleSystemToggle = (systemId: string) => {
    const slug = systemsMap.get(systemId);
    setFilters(prev => ({
      ...prev,
      system: slug || '',
    }));
  };

  const retrySystemsTree = () => {
    setSystemsTreeReloadKey((current) => current + 1);
  };

  // ============================================================================
  // COMPUTED
  // ============================================================================
  
  const activeFiltersCount = useMemo(() => {
    return [
      filters.search,
      filters.system,
      filters.modality,
      filters.priceType,
      filters.experience,
      filters.seal,
      ...(filters.styles || []),
    ].filter(Boolean).length;
  }, [filters]);

  const selectedSystemName = useMemo(() => {
    if (!filters.system) return undefined;
    const findName = (nodes: SystemTreeNode[]): string | undefined => {
      for (const node of nodes) {
        if (node.slug === filters.system) return node.name;
        if (node.children) {
          const found = findName(node.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findName(systemsTree);
  }, [systemsTree, filters.system]);

  // ============================================================================
  // EFFECTS
  // ============================================================================
  
  // SEO
  useEffect(() => {
    applySeo(
      'Catálogo de Mesas | Artifício Mesas',
      'Explore mesas de RPG com filtros por sistema, modalidade, preço, nível de experiência e selos DDAL/Covil do Lich.'
    );
  }, []);

  // Load systems tree
  useEffect(() => {
    const loadSystemsTree = async () => {
      try {
        setSystemsTreeError(null);

        const res = await fetch('/api/v1/systems?view=tree');
        if (!res.ok) throw new Error(`Erro ao carregar sistemas (HTTP ${res.status})`);

        const json = await res.json();
        setSystemsTree(json.data ?? []);
      } catch (err) {
        console.error('[CatalogoPage] systems tree', err);
        setSystemsTreeError('Não foi possível carregar os sistemas agora. Tente novamente.');
      }
    };

    loadSystemsTree();
  }, [systemsTreeReloadKey]);

  // Scroll to top quando filtros mudam (não na paginação)
  useEffect(() => {
    if (filters.page === 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [filters.search, filters.system, filters.modality, filters.priceType, filters.experience, filters.seal, filters.sort]);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a1628] to-[#13213f] text-white">
      {/* HEADER */}
      <div className="border-b border-white/10 bg-[#0a1628]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-white mb-1">Catálogo de Mesas</h1>
              <p className="text-sm text-white/60">Encontre a mesa perfeita para você</p>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {systemsTreeError && (
        <section className="container mx-auto px-6 pt-4" aria-live="polite">
          <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-amber-100">{systemsTreeError}</p>
            <button
              id="catalog-retry-systems-tree"
              type="button"
              onClick={retrySystemsTree}
              className="shrink-0 rounded-lg border border-amber-300/40 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-amber-500/30 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        </section>
      )}

      {/* FILTROS - DESKTOP */}
      <div className="hidden md:block border-b border-white/10 bg-[#0a1628]/60 backdrop-blur-sm sticky top-[88px] z-20">
        <div className="container mx-auto px-6 py-4">
          {/* ZONA 1: Busca */}
          <div className="mb-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Buscar mesas..."
                className="w-full rounded-lg bg-[#13213f] border border-white/10 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors"
              />
            </div>
          </div>

          {/* ZONA 2: Seletor de Sistema */}
          <div className="mb-3">
            <SystemTreeSelector
              tree={systemsTree}
              selectedIds={selectedSystemIds}
              onToggle={handleSystemToggle}
              search={systemSearch}
              onSearchChange={setSystemSearch}
              idPrefix="catalog-desktop"
              singleSelect={true}
            />
          </div>

          {/* ZONA 3: Outros Filtros */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">

            <select
              value={filters.modality}
              onChange={(e) => setFilters(prev => ({ ...prev, modality: e.target.value as any }))}
              className="rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
            >
              <option value="">Modalidade</option>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
              <option value="hibrida">Híbrida</option>
            </select>

            <select
              value={filters.priceType}
              onChange={(e) => setFilters(prev => ({ ...prev, priceType: e.target.value as any }))}
              className="rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
            >
              <option value="">Preço</option>
              <option value="gratuita">Gratuita</option>
              <option value="paga">Paga</option>
            </select>

            <select
              value={filters.experience}
              onChange={(e) => setFilters(prev => ({ ...prev, experience: e.target.value as any }))}
              className="rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
            >
              <option value="">Nível</option>
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="veterano">Veterano</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as any }))}
              className="rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
            >
              <option value="popular">Mais populares</option>
              <option value="recent">Mais recentes</option>
              <option value="ending_soon">Encerrando em breve</option>
            </select>
          </div>

          {/* ZONA 3: Selos + Estilos */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => toggleSeal('ddal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all whitespace-nowrap ${
                filters.seal === 'ddal'
                  ? 'border-amber-300/50 bg-amber-500/20 text-amber-100'
                  : 'border-white/10 bg-[#13213f] text-white/70 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> DDAL
            </button>

            <button
              type="button"
              onClick={() => toggleSeal('covil-do-lich')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all whitespace-nowrap ${
                filters.seal === 'covil-do-lich'
                  ? 'border-purple-300/50 bg-purple-500/20 text-purple-100'
                  : 'border-white/10 bg-[#13213f] text-white/70 hover:border-white/20 hover:bg-white/5'
              }`}
            >
              <Star className="w-3.5 h-3.5" /> Covil do Lich
            </button>

            <div className="h-4 w-px bg-white/10 mx-1" />

            {VALID_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-all whitespace-nowrap ${
                  filters.styles.includes(style)
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
        isApplying={isRefreshing}
      >
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Buscar mesas..."
            className="w-full rounded-lg bg-[#13213f] border border-white/10 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors"
          />
        </div>

        {/* Filtros */}
        <div className="space-y-3">
          <SystemTreeSelector
            tree={systemsTree}
            selectedIds={selectedSystemIds}
            onToggle={handleSystemToggle}
            search={systemSearch}
            onSearchChange={setSystemSearch}
            idPrefix="catalog-mobile"
            singleSelect={true}
          />

          <select
            value={filters.modality}
            onChange={(e) => setFilters(prev => ({ ...prev, modality: e.target.value as any }))}
            className="w-full rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
          >
            <option value="">Modalidade</option>
            <option value="online">Online</option>
            <option value="presencial">Presencial</option>
            <option value="hibrida">Híbrida</option>
          </select>

          <select
            value={filters.priceType}
            onChange={(e) => setFilters(prev => ({ ...prev, priceType: e.target.value as any }))}
            className="w-full rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
          >
            <option value="">Preço</option>
            <option value="gratuita">Gratuita</option>
            <option value="paga">Paga</option>
          </select>

          <select
            value={filters.experience}
            onChange={(e) => setFilters(prev => ({ ...prev, experience: e.target.value as any }))}
            className="w-full rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
          >
            <option value="">Nível</option>
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="veterano">Veterano</option>
          </select>

          <select
            value={filters.sort}
            onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as any }))}
            className="w-full rounded-lg bg-[#13213f] border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-artificio-orange)] transition-colors cursor-pointer"
          >
            <option value="popular">Mais populares</option>
            <option value="recent">Mais recentes</option>
            <option value="ending_soon">Encerrando em breve</option>
          </select>
        </div>

        {/* Selos */}
        <div>
          <p className="text-xs text-white/50 mb-2 font-semibold">Selos</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => toggleSeal('ddal')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                filters.seal === 'ddal'
                  ? 'border-amber-300/50 bg-amber-500/20 text-amber-100'
                  : 'border-white/10 bg-[#13213f] text-white/70'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> DDAL
            </button>

            <button
              type="button"
              onClick={() => toggleSeal('covil-do-lich')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                filters.seal === 'covil-do-lich'
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
            {VALID_STYLES.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => toggleStyle(style)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                  filters.styles.includes(style)
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
          {isRefreshing && (
            <div className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-orange-200 text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              Atualizando resultados...
            </div>
          )}
          
          <ResultsHeader
            count={totalCount}
            sort={filters.sort}
            onSortChange={(newSort) => setFilters(prev => ({ ...prev, sort: newSort as any }))}
            isLoading={isLoading}
            hasMore={hasMore}
          />

          {/* CHIPS DE FILTROS ATIVOS */}
          <ActiveFiltersChips
            filters={{
              search: filters.search,
              system: filters.system,
              modality: filters.modality,
              priceType: filters.priceType,
              experience: filters.experience,
              seal: filters.seal as any, // Parser garante valor válido
              styles: filters.styles,
              sort: filters.sort,
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
        {!isLoading && !isRefreshing && tables.length === 0 ? (
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
                ? Array.from({ length: 12 }).map((_, idx) => <TableCardSkeleton key={idx} />)
                : tables.map((table) => <TableCardComponent key={table.id} table={table} />)}
            </div>

            {/* PAGINATION */}
            {!isLoading && tables.length > 0 && (filters.page > 1 || hasMore) && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={filters.page === 1}
                  className="p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/70">Página</span>
                    <span className="font-semibold text-white">{filters.page}</span>
                    {hasMore && <span className="text-white/50">de muitas</span>}
                  </div>
                  <span className="text-xs text-white/50">{tables.length} resultados nesta página</span>
                </div>

                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!hasMore}
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
