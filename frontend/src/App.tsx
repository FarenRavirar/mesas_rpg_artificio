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
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
