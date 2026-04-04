import { Link } from 'react-router-dom';
import { Compass, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const SiteHeader = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDevToolsFlagEnabled = import.meta.env.VITE_ENABLE_DEVTOOLS === 'true';

  const handleLoginClick = () => {
    window.location.href = '/api/v1/auth/google';
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#1B2A4A]/85 border-b border-white/10 shadow-2xl">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-[var(--color-artificio-orange)] font-bold text-xl tracking-wide" id="site-header-logo">
          <Compass className="w-6 h-6" />
          <span>Artifício<span className="text-white">Mesas</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-5 text-sm text-white/75">
          <Link to="/catalogo" className="hover:text-white transition-colors" id="site-header-link-catalogo">Catálogo</Link>
          <Link to="/painel" className="hover:text-white transition-colors" id="site-header-link-painel">Painel</Link>
          {isAdmin && (
            <Link to="/admin/devtools" className="hover:text-white transition-colors" id="site-header-link-admin-devtools">Admin DevTools</Link>
          )}
        </nav>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {isAdmin && (
                <span
                  id="site-header-admin-flag-badge"
                  className={`hidden lg:inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wide ${
                    isDevToolsFlagEnabled
                      ? 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10'
                      : 'text-amber-300 border-amber-400/40 bg-amber-500/10'
                  }`}
                  title="Flag operacional para lembrar se o ambiente deve manter a ferramenta de DevTools destacada para QA."
                >
                  VITE_ENABLE_DEVTOOLS: {isDevToolsFlagEnabled ? 'ON' : 'OFF'}
                </span>
              )}

              <div className="group relative">
                <button className="flex items-center space-x-3 bg-white/5 hover:bg-white/10 px-2 py-2 pr-4 rounded-full border border-white/10 transition-colors cursor-pointer" id="site-header-user-menu">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--color-artificio-orange)] text-sm flex items-center justify-center font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.role.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium pr-1 truncate max-w-[120px]">{user.name || 'Jogador'}</span>
                </button>

                <div className="absolute right-0 mt-2 w-56 bg-[#1B2A4A] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                  <Link
                    to="/painel"
                    className="block w-full text-left px-5 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                    id="site-header-menu-painel"
                  >
                    {user.role === 'gm' || user.role === 'admin' ? 'Painel do Mestre' : 'Torne-se um Mestre'}
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin/devtools"
                      className="block w-full text-left px-5 py-3 text-sm text-orange-300 hover:text-orange-200 hover:bg-orange-400/10 transition-colors border-b border-white/5"
                      id="site-header-menu-admin-devtools"
                    >
                      Admin DevTools
                    </Link>
                  )}
                  {isAdmin && (
                    <div id="site-header-menu-devtools-flag-info" className="px-5 py-3 border-b border-white/5 bg-white/5">
                      <p className="text-[11px] font-semibold text-white/90">
                        VITE_ENABLE_DEVTOOLS={isDevToolsFlagEnabled ? 'true' : 'false'}
                      </p>
                      <p className="mt-1 text-[11px] text-white/65 leading-relaxed">
                        Lembrete operacional visível no frontend para não esquecer o modo do ambiente (dev/prod).
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => logout()}
                    className="w-full text-left px-5 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
                    id="site-header-menu-sair"
                  >
                    <span className="inline-flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      Sair
                    </span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <button
              id="site-header-btn-login-google"
              onClick={handleLoginClick}
              className="group relative cursor-pointer px-5 py-2 overflow-hidden rounded-full font-medium text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[var(--color-artificio-orange)] to-[var(--color-artificio-orange-hover)]" />
              <div className="absolute inset-0 w-0 h-full transition-all duration-300 ease-out bg-white/20 group-hover:w-full" />
              <span className="relative flex items-center space-x-2 text-sm font-semibold tracking-wide">
                <LogIn className="w-4 h-4" />
                <span>Entrar com Google</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
