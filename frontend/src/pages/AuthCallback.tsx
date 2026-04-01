import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    // const isNew = searchParams.get('isNew') === 'true'; // Para futuro modal de Onboarding

    if (token) {
      // Decode JWT manualmente para extrair payload básico sem bibliotecas extras no Front
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        
        login(token, { 
          id: decoded.userId, 
          role: decoded.role,
          name: decoded.name,
          avatar_url: decoded.avatar_url
        });
        navigate('/');
      } catch (e) {
        console.error('Erro ao decodificar token de callback:', e);
        navigate('/?error=invalid_token');
      }
    } else {
      navigate('/');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-artificio-blue)] text-white">
      <div className="flex flex-col items-center space-y-4 animate-pulse">
        <div className="w-12 h-12 border-4 border-[var(--color-artificio-orange)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium tracking-widest text-[#a8b8d8]">AUTENTICANDO...</p>
      </div>
    </div>
  );
};
