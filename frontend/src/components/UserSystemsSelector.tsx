import { useState, useEffect } from 'react';
import { SystemTreeSelector } from './SystemTreeSelector';
import type { SystemTreeNode } from '../types/systems';

interface UserSystemsSelectorProps {
  type: 'favorite' | 'gm';
  selectedSystemIds: string[];
  onAdd: (systemId: string) => void;
  onRemove: (systemId: string) => void;
}

/**
 * Componente para selecionar sistemas favoritos ou sistemas que o usuário mestra
 * Usa o SystemTreeSelector existente com multi-seleção
 */
export function UserSystemsSelector({
  type,
  selectedSystemIds,
  onAdd,
  onRemove,
}: UserSystemsSelectorProps) {
  const [tree, setTree] = useState<SystemTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSystemsTree();
  }, []);

  const fetchSystemsTree = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/v1/systems?view=tree`);
      if (!response.ok) throw new Error('Erro ao buscar árvore de sistemas');
      
      const result = await response.json();
      console.log('[UserSystemsSelector] Sistemas carregados:', result.data?.length || 0);
      setTree(result.data || []);
    } catch (error) {
      console.error('[UserSystemsSelector] Erro ao buscar sistemas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (systemId: string) => {
    if (selectedSystemIds.includes(systemId)) {
      onRemove(systemId);
    } else {
      onAdd(systemId);
    }
  };

  if (loading) {
    return (
      <div className="user-systems-selector-loading">
        <div className="spinner-small"></div>
        <p>Carregando sistemas...</p>
      </div>
    );
  }

  console.log('[UserSystemsSelector] Renderizando com tree:', tree.length, 'sistemas');

  return (
    <div className="user-systems-selector">
      <div className="systems-selector-header">
        <p className="systems-count">
          {selectedSystemIds.length} {type === 'favorite' ? 'favorito(s)' : 'sistema(s) que você mestra'}
        </p>
      </div>

      <SystemTreeSelector
        tree={tree}
        selectedIds={selectedSystemIds}
        onToggle={handleToggle}
        search={search}
        onSearchChange={setSearch}
        idPrefix={`profile-${type}`}
        singleSelect={false}
      />
    </div>
  );
}
