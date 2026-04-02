import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetchTables } from '../hooks/useFetchTables';
import { TableCardComponent, TableCardSkeleton } from '../components/TableCard';
import { Search } from 'lucide-react';
import { applySeo } from '../utils/seo';

export const HomePage = () => {
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const { tables, isLoading, error } = useFetchTables({ limit: 12, search: activeSearch || undefined });

  useEffect(() => {
    applySeo(
      'Artifício Mesas | Descubra sua próxima aventura',
      'Catálogo colaborativo para descobrir e publicar mesas de RPG online e presenciais com filtros avançados.'
    );
  }, []);

  const handleSearch = () => {
    setActiveSearch(searchInput.trim());
  };

  return (
    <main className="bg-[var(--color-artificio-blue)] font-sans text-white">
      <section className="relative w-full py-16 lg:py-24 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-artificio-orange)] rounded-full blur-[150px] opacity-10 pointer-events-none" />
        <div className="container mx-auto px-6 text-center space-y-8 relative z-10">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight">
            Descubra Sua Próxima<br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-artificio-orange)] to-yellow-400"> Aventura</span>
          </h1>
          <p className="max-w-2xl mx-auto text-[#a8b8d8] text-lg lg:text-xl font-light">
            O catálogo oficial, 100% gratuito e organizado de mesas de RPG. Junte-se à maior comunidade de construtores de mundos do Brasil.
          </p>

          <div className="max-w-2xl mx-auto mt-10 p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center shadow-2xl focus-within:ring-2 focus-within:ring-[var(--color-artificio-orange)]/50 transition-all">
            <Search className="w-6 h-6 text-white/50 ml-4 hidden sm:block" />
            <input
              id="input-busca-mesas"
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar mesas por nome, sistema ou mestre..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-white placeholder-white/50"
            />
            <button
              id="btn-buscar-mesas"
              onClick={handleSearch}
              className="bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] text-white px-6 py-3 rounded-full font-semibold transition-colors duration-200 cursor-pointer"
            >
              Procurar
            </button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold tracking-wide">
            {activeSearch ? `Resultados para "${activeSearch}"` : 'Abertas Recentemente'}
          </h2>
          <Link
            to="/catalogo"
            className="text-sm px-4 py-2 rounded-lg border border-white/15 hover:border-[var(--color-artificio-orange)] hover:text-[var(--color-artificio-orange)] transition-colors"
            id="btn-ver-catalogo-completo-home"
          >
            Ver catálogo completo
          </Link>
        </div>

        {error && (
          <div className="text-center py-20 text-red-400">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <TableCardSkeleton key={i} />)
            : tables.length > 0
              ? tables.map(t => <TableCardComponent key={t.id} table={t} />)
              : !error && (
                <div className="col-span-3 text-center py-20 text-white/40">
                  <p className="text-4xl mb-4">🗺️</p>
                  <p className="text-lg font-medium">Nenhuma mesa encontrada.</p>
                  <p className="text-sm mt-2">Seja o primeiro a publicar uma aventura!</p>
                </div>
              )}
        </div>
      </section>
    </main>
  );
};
