import { useAuth } from '../contexts/AuthContext';
import { Search, Compass, LogIn } from 'lucide-react';

export const HomePage = () => {
  const { user } = useAuth();

  const handleLoginClick = () => {
    // Redireciona para nosso endpoint do servidor que inicia o handshake Google OAuth
    window.location.href = '/api/v1/auth/google';
  };

  return (
    <div className="min-h-screen bg-[var(--color-artificio-blue)] font-sans text-white">
      {/* Header Premium Glassmorphism */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#1B2A4A]/80 border-b border-white/5 shadow-2xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[var(--color-artificio-orange)] font-bold text-xl tracking-wide">
            <Compass className="w-6 h-6" />
            <span>Artifício<span className="text-white">Mesas</span></span>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full border border-white/5">
                <div className="w-8 h-8 rounded-full bg-[var(--color-artificio-orange)] text-sm flex items-center justify-center font-bold">
                  {user.role[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium">Logado</span>
              </div>
            ) : (
              <button 
                onClick={handleLoginClick}
                className="group relative cursor-pointer px-5 py-2 overflow-hidden rounded-full font-medium text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[var(--color-artificio-orange-hover)] to-[var(--color-artificio-orange)]"></div>
                <div className="absolute inset-0 w-0 h-full transition-all duration-300 ease-out bg-white/20 group-hover:w-full"></div>
                <span className="relative flex items-center space-x-2 text-sm font-semibold tracking-wide">
                  <LogIn className="w-4 h-4" />
                  <span>Entrar com o Google</span>
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Interativo */}
      <section className="relative w-full py-16 lg:py-24 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-artificio-orange)] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
        
        <div className="container mx-auto px-6 text-center space-y-8 relative z-10">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight">
            Descubra Sua Próxima <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r gap-2 from-[var(--color-artificio-orange)] to-yellow-400">Aventura</span>
          </h1>
          <p className="max-w-2xl mx-auto text-[#a8b8d8] text-lg lg:text-xl font-light">
            O catálogo oficial, 100% gratuito e organizado de mesas de RPG. Junte-se à maior comunidade de construtores de mundos independente do Brasil.
          </p>

          <div className="max-w-2xl mx-auto mt-10 p-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center shadow-2xl focus-within:ring-2 focus-within:ring-[var(--color-artificio-orange)]/50 transition-all">
            <Search className="w-6 h-6 text-white/50 ml-4 hidden sm:block" />
            <input 
              type="text" 
              placeholder="Buscar mesas por série, sistema ou mestre..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-white placeholder-white/50"
            />
            <button className="bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] text-white px-6 py-3 rounded-full font-semibold transition-colors duration-200">
              Procurar
            </button>
          </div>
        </div>
      </section>

      {/* Catálogo Grid (Placeholder Rápido Fase 1) */}
      <section className="container mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-wide">Abertas Recentemente</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Skeleton Cards simulando as mesas que virão do Backend na Fase 2 */}
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="group relative w-full h-[340px] rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A4A] via-[#1B2A4A]/50 to-transparent z-10"></div>
              <div className="absolute bottom-0 left-0 p-6 z-20 w-full space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-white/10 backdrop-blur-sm rounded-md text-xs font-semibold text-[var(--color-artificio-orange)] border border-white/5">D&D 5e</span>
                  <span className="px-2 py-1 bg-white/10 backdrop-blur-sm rounded-md text-xs font-semibold text-white border border-white/5">Online</span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-[var(--color-artificio-orange)] transition-colors line-clamp-2">Lendários Espinhosos: A Queda do Império</h3>
                <p className="text-sm text-[#a8b8d8] line-clamp-2">Campanha de fantasia medieval dark, iniciantes bem-vindos. Foco em RP.</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
