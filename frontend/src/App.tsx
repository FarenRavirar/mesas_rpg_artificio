import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/catalogo" element={<CatalogoPage />} />
            <Route path="/mesas/:slug" element={<MesaPage />} />
            <Route path="/mestre/:slug" element={<MestrePage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/painel" element={<ProtectedRoute><PainelMestrePage /></ProtectedRoute>} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
