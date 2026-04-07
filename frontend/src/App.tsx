import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallback } from './pages/AuthCallback';
import { PainelMestrePage } from './pages/PainelMestrePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { CatalogoPage } from './pages/CatalogoPage';
import { MesaPage } from './pages/MesaPage';
import { MestrePage } from './pages/MestrePage';
import { PlayerPage } from './pages/PlayerPage';
import { MasterProfilePage } from './features/master/MasterProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import { GestaoPage } from './pages/GestaoPage';
import { AdminDevToolsPage } from './pages/AdminDevToolsPage';
import { Toaster } from 'react-hot-toast';
import './index.css';

function AppRoutes() {
  const { user, isLoading } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/catalogo" element={<CatalogoPage />} />
      <Route path="/mesas/:slug" element={<MesaPage />} />
      <Route path="/mestre/:slug" element={<MestrePage />} />
      <Route path="/jogador/:username" element={<PlayerPage />} />
      <Route path="/mestres/:masterId" element={<MasterProfilePage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute><ProfileEditPage /></ProtectedRoute>} />
      <Route path="/painel" element={<ProtectedRoute><PainelMestrePage /></ProtectedRoute>} />
      {!isLoading && isAdmin && (
        <>
          <Route path="/gestao" element={<ProtectedRoute requiredRole="admin"><GestaoPage /></ProtectedRoute>} />
          <Route path="/admin/devtools" element={<ProtectedRoute requiredRole="admin"><AdminDevToolsPage /></ProtectedRoute>} />
        </>
      )}
    </Routes>
  );
}

function App() {
  const [backendHealthy, setBackendHealthy] = React.useState<boolean | null>(null);

  // CORREÇÃO DT-012: Validar backend antes de renderizar
  React.useEffect(() => {
    const checkBackend = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/v1/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        setBackendHealthy(response.ok);
      } catch {
        setBackendHealthy(false);
      }
    };
    checkBackend();
  }, []);

  if (backendHealthy === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>Conectando ao backend...</div>
          <div style={{ fontSize: '14px', opacity: 0.6 }}>Aguarde</div>
        </div>
      </div>
    );
  }

  if (backendHealthy === false) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white', backgroundColor: '#1a1a1a' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ fontSize: '24px', marginBottom: '16px', fontWeight: 'bold' }}>Backend não disponível</div>
          <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '24px' }}>
            O servidor backend não está respondendo. Tente novamente em alguns instantes.
          </div>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '12px 24px', fontSize: '16px', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: '#ff6b35', color: 'white' }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <AppRoutes />
        </AppShell>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
