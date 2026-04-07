import { useState, useEffect } from 'react';
import type { TablesResponse, TableCard, CatalogSeal } from '../types/tables';

interface UseFetchTablesOptions {
  limit?: number;
  featured?: boolean;
  search?: string;
  system?: string;
  seal?: CatalogSeal;
}

export const useFetchTables = (options: UseFetchTablesOptions = {}) => {
  const [tables, setTables] = useState<TableCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0); // CORREÇÃO DT-05

  useEffect(() => {
    const controller = new AbortController();

    const fetchTables = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.limit) params.set('limit', String(options.limit));
      if (options.featured) params.set('featured', 'true');
      if (options.search) params.set('search', options.search);
      if (options.system) params.set('system', options.system);
      if (options.seal) params.set('seal', options.seal);

      try {
        const res = await fetch(`/api/v1/tables?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: TablesResponse = await res.json();
        setTables(json.data);
        // CORREÇÃO DT-05: Extrair totalCount do pagination
        setTotalCount(json.pagination?.total ?? json.data.length);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setError('Não foi possível carregar as mesas.');
        console.error('[useFetchTables]', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTables();
    return () => controller.abort();
  }, [options.limit, options.featured, options.search, options.system, options.seal]);

  return { tables, isLoading, error, totalCount }; // CORREÇÃO DT-05
};
