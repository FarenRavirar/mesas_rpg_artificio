import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './pages/HomePage';
import { AuthCallback } from './pages/AuthCallback';
import { PainelMestrePage } from './pages/PainelMestrePage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/painel" element={<PainelMestrePage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
