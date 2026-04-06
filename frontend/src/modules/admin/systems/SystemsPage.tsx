import { useEffect, useState } from 'react';
import { Plus, List, Network } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSystems } from './useSystems';
import { SystemsList } from './SystemsList';
import { SystemsTree } from './SystemsTree';
import { SystemEditModal } from '../../../components/SystemEditModal';
import type { System } from './types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface TreeNode extends System {
  children?: TreeNode[];
  depth?: number;
  has_children?: boolean;
}

// Função para filtrar árvore recursivamente
function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  if (!query) return nodes;

  const lowerQuery = query.toLowerCase();
  
  return nodes.reduce<TreeNode[]>((acc, node) => {
    const matchesName = node.name.toLowerCase().includes(lowerQuery);
    const matchesSlug = node.slug.toLowerCase().includes(lowerQuery);
    
    // Filtrar filhos recursivamente
    const filteredChildren = node.children ? filterTree(node.children, query) : [];
    
    // Incluir nó se ele ou algum filho corresponder à busca
    if (matchesName || matchesSlug || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children,
      });
    }
    
    return acc;
  }, []);
}

export function SystemsPage() {
  const { token } = useAuth();
  const {
    systems,
    loading,
    searchQuery,
    setSearchQuery,
    fetchSystems,
    deleteSystem,
  } = useSystems(token);

  const [systemEditModal, setSystemEditModal] = useState<System | null>(null);
  const [systemsTree, setSystemsTree] = useState<TreeNode[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree'); // Padrão: árvore

  useEffect(() => {
    fetchSystems();
    fetchSystemsTree();
  }, []);

  const fetchSystemsTree = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/systems?view=tree`);
      if (response.ok) {
        const data = await response.json();
        setSystemsTree(data.data || []);
      }
    } catch (error) {
      console.error('[SystemsPage] Erro ao buscar árvore:', error);
    }
  };

  const handleSuccess = () => {
    fetchSystems();
    fetchSystemsTree();
  };

  // Filtrar árvore com base na busca
  const filteredTree = filterTree(systemsTree, searchQuery);

  return (
    <>
      {/* Busca, toggle e botão adicionar */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar sistemas..."
          className="flex-1 px-4 py-2 bg-[#0F1A2E] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
        />
        
        {/* Toggle de visualização */}
        <div className="flex gap-1 bg-[#0F1A2E] border border-white/10 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded transition-colors flex items-center gap-2 ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white'
                : 'text-white/60 hover:text-white'
            }`}
            title="Lista"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-2 rounded transition-colors flex items-center gap-2 ${
              viewMode === 'tree'
                ? 'bg-blue-500 text-white'
                : 'text-white/60 hover:text-white'
            }`}
            title="Árvore"
          >
            <Network className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setSystemEditModal({} as System)}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Adicionar
        </button>
      </div>

      {/* Visualização */}
      {loading ? (
        <div className="text-center py-12 text-white/50">Carregando...</div>
      ) : viewMode === 'tree' ? (
        <SystemsTree
          systems={filteredTree}
          onEdit={setSystemEditModal}
          onDelete={deleteSystem}
        />
      ) : (
        <SystemsList
          systems={systems}
          onEdit={setSystemEditModal}
          onDelete={deleteSystem}
        />
      )}

      {/* Modal */}
      {systemEditModal && (
        <SystemEditModal
          system={systemEditModal.id ? systemEditModal : null}
          systemsTree={systemsTree}
          token={token!}
          onClose={() => setSystemEditModal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
