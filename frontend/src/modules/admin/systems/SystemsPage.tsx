import { useEffect, useState } from 'react';
import { Plus, List, Network, CheckSquare } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useSystems } from './useSystems';
import { SystemsList } from './SystemsList';
import { SystemsTree } from './SystemsTree';
import { SystemEditModal } from '../../../components/SystemEditModal';
import toast from 'react-hot-toast';
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

// Função para coletar todos os IDs (nó + filhos recursivamente)
function collectAllIds(node: TreeNode): string[] {
  const ids = [node.id];
  if (node.children) {
    node.children.forEach(child => {
      ids.push(...collectAllIds(child));
    });
  }
  return ids;
}

// Função para contar total de itens selecionados (incluindo filhos)
function countSelectedWithChildren(selectedIds: Set<string>, tree: TreeNode[]): number {
  const allIds = new Set<string>();
  
  tree.forEach(node => {
    if (selectedIds.has(node.id)) {
      collectAllIds(node).forEach(id => allIds.add(id));
    }
    if (node.children) {
      countSelectedInChildren(node.children, selectedIds, allIds);
    }
  });
  
  return allIds.size;
}

function countSelectedInChildren(nodes: TreeNode[], selectedIds: Set<string>, allIds: Set<string>) {
  nodes.forEach(node => {
    if (selectedIds.has(node.id)) {
      collectAllIds(node).forEach(id => allIds.add(id));
    }
    if (node.children) {
      countSelectedInChildren(node.children, selectedIds, allIds);
    }
  });
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
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('tree');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const handleBulkDelete = async () => {
    const totalCount = countSelectedWithChildren(selectedIds, systemsTree);
    
    if (totalCount <= 5) {
      if (!confirm(`Deletar ${totalCount} item(ns) selecionado(s)? Esta ação não pode ser desfeita.`)) {
        return;
      }
    } else {
      const confirmMsg = `⚠️ DELEÇÃO EM MASSA

Você selecionou ${selectedIds.size} item(ns).
Isso irá deletar ${totalCount} item(ns) no total (incluindo filhos).

Esta ação é IRREVERSÍVEL.

Digite "DELETAR" para confirmar:`;
      
      const input = prompt(confirmMsg);
      if (input !== 'DELETAR') return;
    }

    // Deletar todos os selecionados
    let successCount = 0;
    for (const id of selectedIds) {
      try {
        const response = await fetch(`${API_BASE}/api/v1/systems/admin/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) successCount++;
      } catch (error) {
        console.error('[SystemsPage] Erro ao deletar:', error);
      }
    }

    toast.success(`${successCount} sistema(s) deletado(s)!`);
    setSelectedIds(new Set());
    setSelectionMode(false);
    handleSuccess();
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

        {/* Botão Modo Seleção */}
        <button
          onClick={() => {
            setSelectionMode(!selectionMode);
            setSelectedIds(new Set());
          }}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            selectionMode
              ? 'bg-purple-500 hover:bg-purple-600 text-white'
              : 'bg-[#0F1A2E] border border-white/10 text-white/60 hover:text-white'
          }`}
          title="Modo Seleção"
        >
          <CheckSquare className="w-5 h-5" />
          {selectionMode && selectedIds.size > 0 && `(${selectedIds.size})`}
        </button>

        {/* Botão Deletar Selecionados */}
        {selectionMode && selectedIds.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
          >
            Deletar Selecionados
          </button>
        )}

        {/* Botão Adicionar */}
        {!selectionMode && (
          <button
            onClick={() => setSystemEditModal({} as System)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar
          </button>
        )}
      </div>

      {/* Visualização */}
      {loading ? (
        <div className="text-center py-12 text-white/50">Carregando...</div>
      ) : viewMode === 'tree' ? (
        <SystemsTree
          systems={filteredTree}
          onEdit={setSystemEditModal}
          onDelete={deleteSystem}
          token={token!}
          onUpdate={handleSuccess}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
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
