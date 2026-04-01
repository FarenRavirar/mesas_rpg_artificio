import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface DecodedToken {
  userId: string;
  role: 'visitor' | 'player' | 'gm' | 'admin';
  name?: string;
  avatar_url?: string;
}

const decodeJwtPayload = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );

    return JSON.parse(jsonPayload) as DecodedToken;
  } catch {
    return null;
  }
};

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const token = searchParams.get('token');

      if (!token) {
        navigate('/', { replace: true });
        return;
      }

      const decoded = decodeJwtPayload(token);
      if (!decoded) {
        navigate('/?error=invalid_token', { replace: true });
        return;
      }

      login(token, {
        id: decoded.userId,
        role: decoded.role,
        name: decoded.name,
        avatar_url: decoded.avatar_url,
      });

      try {
        const meRes = await fetch('/api/v1/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!meRes.ok) {
          navigate('/', { replace: true });
          return;
        }

        const meJson = await meRes.json();
        const onboardingCompleted = Boolean(meJson?.data?.onboarding_completed);

        navigate(onboardingCompleted ? '/' : '/onboarding', { replace: true });
      } catch (error) {
        console.error('Erro ao validar onboarding no callback:', error);
        navigate('/', { replace: true });
      }
    };

    handleAuthCallback();
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
