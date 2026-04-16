import { useEffect, useMemo, useState } from 'react';
import type { UserLink } from './useLinks';
import type { TableCard } from '../types/tables';

export interface ViewerContext {
  is_owner: boolean;
  is_admin: boolean;
}

export interface MestrePublicData {
  id: string;
  slug: string;
  display_name: string;
  bio_long: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  languages: string[];
  specialties: string[];
  badges: string[];
  tables_count: number;
  avg_rating: number | null;
  reviews_count: number;
  created_at: string;
  viewer_context?: ViewerContext;
  discord_connected?: boolean;
  discord_username?: string | null;
  covil_verified?: boolean;
  experience_years?: number | null;
  average_price?: number | null;
  links?: UserLink[];
  tables: Array<Omit<TableCard, 'gm_slug' | 'gm_avatar_url' | 'gm_display_name'>>;
}

interface GmProfilePayload {
  data: MestrePublicData;
}

export function useMestre(slug?: string) {
  const [profile, setProfile] = useState<MestrePublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      if (!slug) {
        setError('Perfil inválido.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/v1/gm/${slug}`, {
          signal: controller.signal,
          credentials: 'include',
        });

        if (res.status === 404) {
          setError('Mestre não encontrado.');
          setProfile(null);
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as GmProfilePayload;
        setProfile(json.data ?? null);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError('Não foi possível carregar o perfil do mestre.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    return () => controller.abort();
  }, [slug]);

  const links = useMemo(() => profile?.links ?? [], [profile]);

  const mappedTables = useMemo(() => {
    if (!profile) return [] as TableCard[];

    return profile.tables.map((table: any) => ({
      ...table,
      gm_slug: profile.slug,
      gm_avatar_url: profile.avatar_url,
      gm_display_name: profile.display_name,
    }));
  }, [profile]);

  const totalOpenSlots = useMemo(() => {
    return mappedTables.reduce((acc, t) => acc + (t.slots_total - t.slots_filled), 0);
  }, [mappedTables]);

  const canSeeInsights = !!profile?.viewer_context?.is_owner || !!profile?.viewer_context?.is_admin;

  return {
    profile,
    links,
    mappedTables,
    totalOpenSlots,
    canSeeInsights,
    loading,
    error,
  };
}
