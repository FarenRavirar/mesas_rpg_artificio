import { useEffect, useState } from 'react';

interface GmInsightsPayload {
  data: {
    metrics: Array<{
      id: string;
      slug: string;
      title: string;
      views: number;
      clicks: number;
      contacts: number;
      favorites: number;
    }>;
    recommendations: Array<{
      table_slug: string;
      severity: 'high' | 'medium' | 'low';
      message: string;
    }>;
  };
}

interface UseMestreInsightsParams {
  slug?: string;
  canSeeInsights: boolean;
}

export function useMestreInsights({ slug, canSeeInsights }: UseMestreInsightsParams) {
  const [insights, setInsights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadInsights = async () => {
      if (!slug || !canSeeInsights) {
        setInsights([]);
        setRecommendations([]);
        return;
      }

      setInsightsLoading(true);

      try {
        const res = await fetch(`/api/v1/gm/${slug}/insights`, {
          signal: controller.signal,
          credentials: 'include',
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as GmInsightsPayload;

        const metricsInsights = (json.data?.metrics ?? []).map(
          (metric) =>
            `${metric.title}: ${metric.views} visualizações, ${metric.contacts} contatos e ${metric.favorites} favoritos.`
        );

        const recs = (json.data?.recommendations ?? []).map((rec) => {
          const prefix = rec.severity === 'high'
            ? '🔴'
            : rec.severity === 'medium'
              ? '🟡'
              : '🟢';
          return `${prefix} ${rec.message}`;
        });

        setInsights(metricsInsights);
        setRecommendations(recs);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setInsights([]);
        setRecommendations([]);
      } finally {
        setInsightsLoading(false);
      }
    };

    loadInsights();
    return () => controller.abort();
  }, [slug, canSeeInsights]);

  return {
    insights,
    recommendations,
    insightsLoading,
  };
}
