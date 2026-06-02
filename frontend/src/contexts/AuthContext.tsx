import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { AuthContext, isValidRole } from './authContextCore';
import type { User } from './authContextCore';

export type { User } from './authContextCore';

const API_BASE = import.meta.env.VITE_API_URL || '';

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
