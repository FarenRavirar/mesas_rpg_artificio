import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_URL;

if (!API_BASE) {
  throw new Error('VITE_API_URL não configurada');
}

export interface User {
  id: string;
  role: 'visitor' | 'player' | 'gm' | 'admin';
  name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isValidRole = (value: unknown): value is User['role'] => {
  return value === 'visitor' || value === 'player' || value === 'gm' || value === 'admin';
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const meRes = await fetch(`${API_BASE}/api/v1/me`, {
        credentials: 'include',
      });

      if (meRes.status === 401 || meRes.status === 403) {
        clearSession();
        return;
      }

      if (!meRes.ok) {
        throw new Error(`Falha ao consultar sessão: ${meRes.status}`);
      }

      const meJson = await meRes.json();
      const apiUser = meJson?.data?.user;
      const displayName = meJson?.data?.profile?.display_name;

      if (apiUser?.id && isValidRole(apiUser.role)) {
        setUser({
          id: apiUser.id,
          role: apiUser.role,
          name: displayName ?? apiUser.email?.split('@')[0],
          avatar_url: undefined,
        });
        return;
      }

      clearSession();
    } catch (error) {
      console.warn('[AuthContext] Erro ao hidratar sessão:', error);
    }
  }, [clearSession]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        await refreshSession();
      } finally {
        if (active) setIsLoading(false);
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.warn('[AuthContext] Falha ao chamar logout:', error);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        refreshSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
};
