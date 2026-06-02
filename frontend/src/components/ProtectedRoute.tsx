import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'visitor' | 'player' | 'gm' | 'admin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  // CORREÇÃO B06: Usar isAuthenticated em vez de token
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[var(--color-artificio-blue)] text-white flex items-center justify-center">
        <div id="protected-route-loading" className="animate-pulse text-white/70">
          Validando sessão...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
