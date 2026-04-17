import { useState } from 'react';
import toast from 'react-hot-toast';
import type { System } from './types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function useSystems() {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSystems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/systems?view=flat`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setSystems(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error('[useSystems] Erro ao buscar sistemas:', error);
      setSystems([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSystem = async (id: string, name: string) => {
    if (!confirm(`Deletar sistema "${name}"? Esta ação não pode ser desfeita.`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/systems/admin/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Sistema deletado!');
        fetchSystems();
      } else {
        let errorMessage = 'Erro ao deletar sistema';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch {
          // Mantém fallback quando resposta não é JSON
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('[useSystems] Erro ao deletar sistema:', error);
      toast.error('Erro ao deletar sistema');
    }
  };

  const filteredSystems = systems.filter((sys) =>
    searchQuery
      ? sys.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sys.slug.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return {
    systems: filteredSystems,
    loading,
    searchQuery,
    setSearchQuery,
    fetchSystems,
    deleteSystem,
  };
}
