import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface GmInsightsOverview {
  total_views: number;
  total_clicks: number;
  total_contacts: number;
  total_favorites: number;
  ctr: number;
  contact_rate: number;
}

interface TableInsight {
  id: string;
  slug: string;
  title: string;
  status: string;
  system_name: string | null;
  views: number;
  clicks: number;
  contacts: number;
  favorites: number;
  ctr: number;
  click_breakdown: {
    refactored_v4: number;
    cta_entrar: number;
    link_vtt: number;
  };
}

interface Recommendation {
  severity: 'high' | 'medium' | 'low';
  table_slug: string;
  table_title: string;
  message: string;
}

interface GmInsightsData {
  overview: GmInsightsOverview;
  tables: TableInsight[];
  recommendations: Recommendation[];
}

export function useGmInsights() {
  const [data, setData] = useState<GmInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/v1/gm/insights`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Perfil de mestre não encontrado');
          }
          throw new Error('Erro ao carregar insights');
        }

        const insights = await response.json();
        setData(insights);
      } catch (err: any) {
        console.error('[useGmInsights]', err);
        setError(err.message || 'Erro ao carregar insights');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return { data, loading, error };
}
