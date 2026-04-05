import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface User {
  id: string;
  role: 'visitor' | 'player' | 'gm' | 'admin';
  name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userPayload: User) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

interface JwtPayload {
  userId?: string;
  role?: User['role'];
  name?: string;
  avatar_url?: string;
  exp?: number;
}

const TOKEN_STORAGE_KEY = '@ArtificioMesas:token';
const USER_STORAGE_KEY = '@ArtificioMesas:user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isValidRole = (value: unknown): value is User['role'] => {
  return value === 'visitor' || value === 'player' || value === 'gm' || value === 'admin';
};

const parseStoredUser = (raw: string | null): User | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<User>;
    if (!parsed.id || !isValidRole(parsed.role)) return null;

    return {
      id: parsed.id,
      role: parsed.role,
      name: parsed.name,
      avatar_url: parsed.avatar_url,
    };
  } catch {
    return null;
  }
};

const parseJwt = (token: string): JwtPayload | null => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
    const jsonPayload = decodeURIComponent(
      window
        .atob(paddedBase64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );

    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrapSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        if (active) setIsLoading(false);
        return;
      }

      const decoded = parseJwt(storedToken);
      if (decoded?.exp && decoded.exp * 1000 <= Date.now()) {
        clearSession();
        if (active) setIsLoading(false);
        return;
      }

      const cachedUser = parseStoredUser(localStorage.getItem(USER_STORAGE_KEY));

      if (!active) return;
      setToken(storedToken);

      if (cachedUser) {
        setUser(cachedUser);
      } else if (decoded?.userId && isValidRole(decoded.role)) {
        setUser({
          id: decoded.userId,
          role: decoded.role,
          name: decoded.name,
          avatar_url: decoded.avatar_url,
        });
      }

      // Validação inteligente: só chamar backend se token expirar em < 5 minutos
      const expiresIn = decoded?.exp ? (decoded.exp * 1000 - Date.now()) : 0;
      const shouldRevalidate = expiresIn < 5 * 60 * 1000; // 5 minutos

      if (!shouldRevalidate) {
        // Token ainda válido por mais de 5 minutos, não precisa validar
        if (active) setIsLoading(false);
        return;
      }

      // Token próximo de expirar, validar com backend
      try {
        const meRes = await fetch('/api/v1/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        if (!active) return;

        if (!meRes.ok) {
          // Só limpa sessão se for 401 (não autorizado) ou 403 (proibido)
          // Outros erros (500, timeout) mantêm a sessão local
          if (meRes.status === 401 || meRes.status === 403) {
            clearSession();
          }
          setIsLoading(false);
          return;
        }

        const meJson = await meRes.json();
        const apiUser = meJson?.data?.user;
        const displayName = meJson?.data?.profile?.display_name;

        if (apiUser?.id && isValidRole(apiUser.role)) {
          const hydratedUser: User = {
            id: apiUser.id,
            role: apiUser.role,
            name: displayName ?? cachedUser?.name ?? decoded?.name,
            avatar_url: cachedUser?.avatar_url ?? decoded?.avatar_url,
          };

          setUser(hydratedUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(hydratedUser));
        }
      } catch {
        // Mantém sessão local em caso de falha transitória de rede.
      } finally {
        if (active) setIsLoading(false);
      }
    };

    bootstrapSession();

    return () => {
      active = false;
    };
  }, [clearSession]);

  // Listener para sincronizar sessão entre abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Ignorar mudanças em chaves que não sejam do OAuth (ex: dev_admin_token)
      if (e.key && e.key !== TOKEN_STORAGE_KEY && e.key !== USER_STORAGE_KEY) {
        return;
      }
      
      // Sincronizar token entre abas
      if (e.key === TOKEN_STORAGE_KEY) {
        if (e.newValue && e.newValue !== token) {
          // Token foi atualizado em outra aba
          const decoded = parseJwt(e.newValue);
          if (decoded?.userId && isValidRole(decoded.role)) {
            setToken(e.newValue);
            setUser({
              id: decoded.userId,
              role: decoded.role,
              name: decoded.name,
              avatar_url: decoded.avatar_url,
            });
          }
        } else if (!e.newValue && token) {
          // Token foi removido em outra aba (logout)
          clearSession();
        }
      }
      
      // Sincronizar dados do usuário entre abas
      if (e.key === USER_STORAGE_KEY && e.newValue) {
        const updatedUser = parseStoredUser(e.newValue);
        if (updatedUser) {
          setUser(updatedUser);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token, clearSession]);

  const login = useCallback((newToken: string, userPayload: User) => {
    setToken(newToken);
    setUser(userPayload);
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userPayload));
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await fetch('/api/v1/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.warn('Falha ao comunicar logout com a API. Limpando sessão local mesmo assim.', error);
    } finally {
      clearSession();
    }
  }, [clearSession, token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
