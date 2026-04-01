import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFetchTables } from '../hooks/useFetchTables';
import { TableCardComponent, TableCardSkeleton } from '../components/TableCard';
import { Search, Compass, LogIn } from 'lucide-react';
import { applySeo } from '../utils/seo';

export const HomePage = () => {
  const { user, logout } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const { tables, isLoading, error } = useFetchTables({ limit: 12, search: activeSearch || undefined });

  useEffect(() => {
    applySeo(
      'Artifício Mesas | Descubra sua próxima aventura',
      'Catálogo colaborativo para descobrir e publicar mesas de RPG online e presenciais com filtros avançados.'
    );
  }, []);

  const handleLoginClick = () => {
    window.location.href = '/api/v1/auth/google';
  };

  const handleSearch = () => {
    setActiveSearch(searchInput.trim());
  };

  return (
    <div className="min-h-screen bg-[var(--color-artificio-blue)] font-sans text-white">
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#1B2A4A]/80 border-b border-white/5 shadow-2xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-[var(--color-artificio-orange)] font-bold text-xl tracking-wide">
            <Compass className="w-6 h-6" />
            <span>Artifício<span className="text-white">Mesas</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-5 text-sm text-white/70">
            <Link to="/catalogo" className="hover:text-white transition-colors" id="nav-catalogo-home">Catálogo</Link>
            <Link to="/painel" className="hover:text-white transition-colors" id="nav-painel-home">Painel</Link>
          </nav>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="group relative">
                  <button className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 px-2 py-2 pr-4 rounded-full border border-white/10 transition-colors cursor-pointer" id="btn-menu-usuario-home">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[var(--color-artificio-orange)] text-sm flex items-center justify-center font-bold">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.role.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium pr-1 truncate max-w-[120px]">
                      {user.name || 'Jogador'}
                    </span>
                  </button>

                  <div className="absolute right-0 mt-2 w-52 bg-[#1B2A4A] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                    <Link
                      to="/painel"
                      className="block w-full text-left px-5 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                      id="menu-painel-home"
                    >
                      {user.role === 'gm' || user.role === 'admin' ? 'Painel do Mestre' : 'Torne-se um Mestre'}
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="w-full text-left px-5 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                      id="menu-sair-home"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                id="btn-login-google"
                onClick={handleLoginClick}
                className="group relative cursor-pointer px-5 py-2 overflow-hidden rounded-full font-medium text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[var(--color-artificio-orange)] to-[var(--color-artificio-orange-hover)]" />
                <div className="absolute inset-0 w-0 h-full transition-all duration-300 ease-out bg-white/20 group-hover:w-full" />
                <span className="relative flex items-center space-x-2 text-sm font-semibold tracking-wide">
                  <LogIn className="w-4 h-4" />
                  <span>Entrar com o Google</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

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
    </div>
  );
};
