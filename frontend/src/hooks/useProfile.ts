import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook para gerenciar perfil de usuário com autosave
 * Debounce de 500ms para evitar requisições excessivas
 */

export interface PlayerProfile {
  experience_level: 'iniciante' | 'intermediario' | 'veterano' | null;
  playstyle: {
    combat?: number;
    roleplay?: number;
    exploration?: number;
    strategy?: number;
  } | null;
  preferred_days: string[] | null;
  preferred_time: 'manha' | 'tarde' | 'noite' | null;
  pricing_preference: 'free' | 'paid' | 'both' | null;
}

export interface GmProfile {
  id: string;
  user_id: string;
  slug: string;
  nickname: string | null;
  bio_long: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  languages: string[];
  specialties: string[];
  discord_connected: boolean;
  discord_username: string | null;
  covil_verified: boolean;
  experience_years: number | null;
  average_price: number | null;
  gm_style: {
    narrative?: number;
    tactical?: number;
    sandbox?: number;
    railroad?: number;
  } | null;
  tools: string[] | null;
  game_format: {
    session_length?: string;
    frequency?: string;
    group_size?: string;
  } | null;
}

export interface UserSystem {
  id: string;
  user_id: string;
  system_id: string;
  type: 'favorite' | 'gm';
  created_at: string;
}

export interface FullProfile {
  user: {
    id: string;
    email: string;
    username: string | null;
    location: string | null;
    role: string;
    created_at: string;
  };
  profile: {
    display_name: string;
    bio: string | null;
    avatar_url: string | null;
    languages: string[];
  } | null;
  player: PlayerProfile | null;
  gm: GmProfile | null;
  systems: {
    favorite: UserSystem[];
    gm: UserSystem[];
  };
}

interface UseProfileReturn {
  profile: FullProfile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateUser: (data: { username?: string; location?: string }) => Promise<void>;
  updateProfile: (data: {
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    languages?: string[];
  }) => Promise<void>;
  updatePlayer: (data: Partial<PlayerProfile>) => Promise<void>;
  updateGm: (data: Partial<GmProfile>) => Promise<void>;
  addSystem: (systemId: string, type: 'favorite' | 'gm') => Promise<void>;
  removeSystem: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

let debounceTimer: number | null = null;

export function useProfile(): UseProfileReturn {
  const { token } = useAuth();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar perfil');
      }

      const result = await response.json();
      setProfile(result.data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('[useProfile] Erro ao buscar perfil:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const debouncedSave = useCallback(
    (fn: () => Promise<void>) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      setSaving(true);

      debounceTimer = setTimeout(async () => {
        try {
          await fn();
          setError(null);
        } catch (err: any) {
          setError(err.message);
          console.error('[useProfile] Erro ao salvar:', err);
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    []
  );

  const updateUser = useCallback(
    async (data: { username?: string; location?: string }) => {
      if (!token) return;

      debouncedSave(async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/profile/me`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar usuário');
        }

        const result = await response.json();
        setProfile((prev) => (prev ? { ...prev, user: result.data } : null));
      });
    },
    [token, debouncedSave]
  );

  const updateProfile = useCallback(
    async (data: {
      display_name?: string;
      bio?: string;
      avatar_url?: string;
      languages?: string[];
    }) => {
      if (!token) return;

      debouncedSave(async () => {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/profile/me/profile`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar perfil');
        }

        const result = await response.json();
        setProfile((prev) => (prev ? { ...prev, profile: result.data } : null));
      });
    },
    [token, debouncedSave]
  );

  const updatePlayer = useCallback(
    async (data: Partial<PlayerProfile>) => {
      if (!token) return;

      debouncedSave(async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/profile/me/player`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar perfil de jogador');
        }

        const result = await response.json();
        setProfile((prev) => (prev ? { ...prev, player: result.data } : null));
      });
    },
    [token, debouncedSave]
  );

  const updateGm = useCallback(
    async (data: Partial<GmProfile>) => {
      if (!token) return;

      debouncedSave(async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/profile/me/gm`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao atualizar perfil de mestre');
        }

        const result = await response.json();
        setProfile((prev) => (prev ? { ...prev, gm: result.data } : null));
      });
    },
    [token, debouncedSave]
  );

  const addSystem = useCallback(
    async (systemId: string, type: 'favorite' | 'gm') => {
      if (!token) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/profile/me/systems`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ system_id: systemId, type }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao adicionar sistema');
        }

        const result = await response.json();
        setProfile((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            systems: {
              ...prev.systems,
              [type]: [...prev.systems[type], result.data],
            },
          };
        });
      } catch (err: any) {
        setError(err.message);
        console.error('[useProfile] Erro ao adicionar sistema:', err);
      }
    },
    [token]
  );

  const removeSystem = useCallback(
    async (id: string) => {
      if (!token) return;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/profile/me/systems/${id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Erro ao remover sistema');
        }

        setProfile((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            systems: {
              favorite: prev.systems.favorite.filter((s) => s.id !== id),
              gm: prev.systems.gm.filter((s) => s.id !== id),
            },
          };
        });
      } catch (err: any) {
        setError(err.message);
        console.error('[useProfile] Erro ao remover sistema:', err);
      }
    },
    [token]
  );

  return {
    profile,
    loading,
    saving,
    error,
    updateUser,
    updateProfile,
    updatePlayer,
    updateGm,
    addSystem,
    removeSystem,
    refetch: fetchProfile,
  };
}
