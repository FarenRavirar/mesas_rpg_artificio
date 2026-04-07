import { useState } from 'react';
import toast from 'react-hot-toast';
import type { System } from './types';

// CORREÇÃO DT-011: Fallback para dev local quando VITE_API_URL não está definida
const API_BASE = import.meta.env.VITE_API_URL || '';

export function useSystems(token: string | null) {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSystems = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/v1/systems?view=flat`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystems(data.data || []);
      }
    } catch (error) {
      console.error('[useSystems] Erro ao buscar sistemas:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSystem = async (id: string, name: string) => {
    if (!token) return;
    if (!confirm(`Deletar sistema "${name}"? Esta ação não pode ser desfeita.`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/systems/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Sistema deletado!');
        fetchSystems();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao deletar sistema');
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
