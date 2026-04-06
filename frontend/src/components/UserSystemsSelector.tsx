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

      {/* Lista de sistemas selecionados */}
      {selectedSystemIds.length > 0 && (
        <div className="selected-systems-list" style={{ marginBottom: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '0.5rem',
            padding: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {selectedSystemIds.map((systemId) => {
              const system = tree.find(s => s.id === systemId) || 
                            tree.flatMap(s => s.children).find(c => c.id === systemId) ||
                            tree.flatMap(s => s.children.flatMap(c => c.children)).find(v => v.id === systemId);
              
              return (
                <div
                  key={systemId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'var(--color-artificio-orange)',
                    color: 'white',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <span>{system?.name || 'Sistema'}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(systemId)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '0',
                      fontSize: '1.25rem',
                      lineHeight: '1',
                      opacity: 0.8
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
