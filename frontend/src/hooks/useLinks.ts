import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface UserLink {
  id: string;
  user_id: string;
  url: string;
  type: 'youtube' | 'spotify' | 'twitch' | 'twitter' | 'article' | 'website';
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  sort_order: number;
  embed_url?: string;
  created_at: string;
  updated_at: string;
}

interface UseLinksReturn {
  links: UserLink[];
  loading: boolean;
  error: string | null;
  addLink: (url: string) => Promise<UserLink | null>;
  removeLink: (linkId: string) => Promise<boolean>;
  reorderLinks: (linkIds: string[]) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useLinks(): UseLinksReturn {
  const { isAuthenticated } = useAuth();
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!isAuthenticated) {
      setLinks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE}/api/v1/profile/links`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Erro ao carregar links');
      }

      const data = await res.json();
      setLinks(data.data || []);
    } catch (err: any) {
      console.error('Error fetching links:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const addLink = useCallback(
    async (url: string): Promise<UserLink | null> => {
      if (!isAuthenticated) return null;

      try {
        setError(null);

        const res = await fetch(`${API_BASE}/api/v1/profile/links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ url }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Erro ao adicionar link');
        }

        const data = await res.json();
        const newLink = data.data;

        setLinks((prev) => [...prev, newLink]);
        return newLink;
      } catch (err: any) {
        console.error('Error adding link:', err);
        setError(err.message);
        return null;
      }
    },
    [isAuthenticated]
  );

  const removeLink = useCallback(
    async (linkId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        setError(null);

        const res = await fetch(`${API_BASE}/api/v1/profile/links/${linkId}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error('Erro ao remover link');
        }

        setLinks((prev) => prev.filter((link) => link.id !== linkId));
        return true;
      } catch (err: any) {
        console.error('Error removing link:', err);
        setError(err.message);
        return false;
      }
    },
    [isAuthenticated]
  );

  const reorderLinks = useCallback(
    async (linkIds: string[]): Promise<boolean> => {
      if (!isAuthenticated) return false;

      try {
        setError(null);

        const res = await fetch(`${API_BASE}/api/v1/profile/links/reorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ linkIds }),
        });

        if (!res.ok) {
          throw new Error('Erro ao reordenar links');
        }

        // Atualizar ordem local
        const reordered = linkIds
          .map((id) => links.find((link) => link.id === id))
          .filter((link): link is UserLink => link !== undefined);

        setLinks(reordered);
        return true;
      } catch (err: any) {
        console.error('Error reordering links:', err);
        setError(err.message);
        return false;
      }
    },
    [isAuthenticated, links]
  );

  const refresh = useCallback(async () => {
    await fetchLinks();
  }, [fetchLinks]);

  return {
    links,
    loading,
    error,
    addLink,
    removeLink,
    reorderLinks,
    refresh,
  };
}
