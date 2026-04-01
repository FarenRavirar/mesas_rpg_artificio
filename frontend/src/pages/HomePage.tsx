import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFetchTables } from '../hooks/useFetchTables';
import type { TableCard } from '../types/tables';
import { Search, Compass, LogIn, Users, Dice1, Globe, MapPin } from 'lucide-react';

// ───── Sub-componente: Card de Mesa ──────────────────────────────────────────

const modalityLabels: Record<string, string> = {
  online: 'Online',
  presencial: 'Presencial',
  hibrida: 'Híbrida',
};

const experienceLabels: Record<string, string> = {
  todos: 'Todos os Níveis',
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  veterano: 'Veterano',
};

function TableCardSkeleton() {
  return (
    <div className="w-full h-[340px] rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
  );
}

function TableCardComponent({ table }: { table: TableCard }) {
  const slotsLeft = table.slots_total - table.slots_filled;
  const isFull = slotsLeft <= 0;

  return (
    <div className="group relative w-full h-[340px] rounded-2xl overflow-hidden bg-[#1B2A4A] border border-white/10 hover:border-[var(--color-artificio-orange)]/40 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(232,82,26,0.15)] hover:-translate-y-1">
      {/* Background cover ou gradiente padrão */}
      {table.cover_url ? (
        <img
          src={table.cover_url}
          alt={table.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2A3F6D] to-[#1B2A4A]" />
      )}

      {/* Gradiente de overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a30] via-[#0d1a30]/70 to-transparent z-10" />

      {/* Badge Destaque */}
      {table.featured && (
        <div className="absolute top-3 right-3 z-20 px-2 py-1 bg-[var(--color-artificio-orange)] rounded-md text-xs font-bold text-white">
          ★ Destaque
        </div>
      )}

      {/* Conteúdo inferior */}
      <div className="absolute bottom-0 left-0 p-5 z-20 w-full space-y-3">
        <div className="flex flex-wrap gap-2">
          {table.system_name && (
            <span className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-xs font-semibold text-[var(--color-artificio-orange)] border border-white/10">
              <Dice1 className="w-3 h-3" />
              {table.system_name}
            </span>
          )}
          <span className="flex items-center gap-1 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md text-xs font-semibold text-white border border-white/10">
            {table.modality === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
            {modalityLabels[table.modality] ?? table.modality}
          </span>
          <span className={`px-2 py-1 rounded-md text-xs font-bold border ${isFull ? 'bg-red-900/50 text-red-300 border-red-700/50' : 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50'}`}>
            {isFull ? 'Lotada' : `${slotsLeft} vaga${slotsLeft !== 1 ? 's' : ''}`}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:text-[var(--color-artificio-orange)] transition-colors line-clamp-2 leading-tight">
          {table.title}
        </h3>

        {table.description && (
          <p className="text-xs text-white/60 line-clamp-2">{table.description}</p>
        )}

        <div className="flex items-center justify-between text-xs text-white/40 pt-1 border-t border-white/5">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {table.slots_filled}/{table.slots_total}
          </span>
          <span>{experienceLabels[table.experience_level] ?? table.experience_level}</span>
          <span className={table.price_type === 'gratuita' ? 'text-emerald-400 font-semibold' : 'text-yellow-400 font-semibold'}>
            {table.price_type === 'gratuita' ? 'Gratuita' : `R$ ${table.price_value}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ───── Página Principal ───────────────────────────────────────────────────────

export const HomePage = () => {
  const { user, logout } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const { tables, isLoading, error } = useFetchTables({ limit: 12, search: activeSearch || undefined });

  const handleLoginClick = () => {
    window.location.href = '/api/v1/auth/google';
  };

  const handleSearch = () => {
    setActiveSearch(searchInput.trim());
  };

  return (
    <div className="min-h-screen bg-[var(--color-artificio-blue)] font-sans text-white">
      {/* Header Glassmorphism */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#1B2A4A]/80 border-b border-white/5 shadow-2xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[var(--color-artificio-orange)] font-bold text-xl tracking-wide">
            <Compass className="w-6 h-6" />
            <span>Artifício<span className="text-white">Mesas</span></span>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <a 
                  href={user.role === 'gm' ? '/painel' : '#'}
                  className="hidden md:flex items-center space-x-2 text-sm text-white/70 hover:text-white transition-colors"
                >
                  {user.role === 'gm' ? 'Painel do Mestre' : 'Meu Perfil'}
                </a>
                
                <div className="group relative">
                  <button className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 px-2 py-2 pr-4 rounded-full border border-white/10 transition-colors cursor-pointer">
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

                  <div className="absolute right-0 mt-2 w-48 bg-[#1B2A4A] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                    <button 
                      onClick={() => {
                        window.location.href = '/painel';
                      }}
                       className="w-full text-left px-5 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                    >
                      {user.role === 'gm' ? 'Painel do Mestre' : 'Torne-se um Mestre'}
                    </button>
                    <button 
                      onClick={() => logout()}
                       className="w-full text-left px-5 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
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

      {/* Hero */}
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

      {/* Catálogo */}
      <section className="container mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-wide">
            {activeSearch ? `Resultados para "${activeSearch}"` : 'Abertas Recentemente'}
          </h2>
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
              )
          }
        </div>
      </section>
    </div>
  );
};
