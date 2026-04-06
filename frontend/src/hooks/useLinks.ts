import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
  const { token } = useAuth();
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    if (!token) {
      setLinks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/v1/profile/links', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
  }, [token]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const addLink = useCallback(
    async (url: string): Promise<UserLink | null> => {
      if (!token) return null;

      try {
        setError(null);

        const res = await fetch('/api/v1/profile/links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
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
    [token]
  );

  const removeLink = useCallback(
    async (linkId: string): Promise<boolean> => {
      if (!token) return false;

      try {
        setError(null);

        const res = await fetch(`/api/v1/profile/links/${linkId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
    [token]
  );

  const reorderLinks = useCallback(
    async (linkIds: string[]): Promise<boolean> => {
      if (!token) return false;

      try {
        setError(null);

        const res = await fetch('/api/v1/profile/links/reorder', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
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
    [token, links]
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
