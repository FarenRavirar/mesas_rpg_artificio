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
import { AdminDevToolsPage } from './pages/AdminDevToolsPage';
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
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/painel" element={<ProtectedRoute><PainelMestrePage /></ProtectedRoute>} />
      {!isLoading && isAdmin && (
        <Route path="/admin/devtools" element={<ProtectedRoute requiredRole="admin"><AdminDevToolsPage /></ProtectedRoute>} />
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
    </BrowserRouter>
  );
}

export default App;
