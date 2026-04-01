import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface User {
  id: string;
  role: 'visitor' | 'player' | 'gm' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userPayload: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to parse JWT
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Tenta inicializar via localStorage na carga inicial
    const storedToken = localStorage.getItem('@ArtificioMesas:token');
    if (storedToken) {
      const decodedInfo = parseJwt(storedToken);
      if (decodedInfo && decodedInfo.exp * 1000 > Date.now()) {
        setToken(storedToken);
        setUser({ id: decodedInfo.userId, role: decodedInfo.role });
      } else {
        localStorage.removeItem('@ArtificioMesas:token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, userPayload: User) => {
    setToken(newToken);
    setUser(userPayload);
    localStorage.setItem('@ArtificioMesas:token', newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('@ArtificioMesas:token');
  };

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
