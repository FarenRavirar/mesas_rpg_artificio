import { useState, useEffect } from 'react';
import type { TablesResponse, TableCard } from '../types/tables';

interface UseFetchTablesOptions {
  limit?: number;
  featured?: boolean;
  search?: string;
  system?: string;
}

export const useFetchTables = (options: UseFetchTablesOptions = {}) => {
  const [tables, setTables] = useState<TableCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchTables = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.limit)    params.set('limit', String(options.limit));
      if (options.featured) params.set('featured', 'true');
      if (options.search)   params.set('search', options.search);
      if (options.system)   params.set('system', options.system);

      try {
        const res = await fetch(`/api/v1/tables?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: TablesResponse = await res.json();
        setTables(json.data);
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
  }, [options.limit, options.featured, options.search, options.system]);

  return { tables, isLoading, error };
};
