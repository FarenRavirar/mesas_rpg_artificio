import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { System } from './types';

const API_BASE = import.meta.env.VITE_API_URL;

if (!API_BASE) {
  throw new Error('VITE_API_URL não configurada');
}

interface TreeNode extends System {
  children?: TreeNode[];
  depth?: number;
  has_children?: boolean;
}

interface SystemsTreeProps {
  systems: TreeNode[];
  onEdit: (system: System) => void;
  onDelete: (id: string, name: string) => void;
  onUpdate: () => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

// Helper: Contar todos os filhos recursivamente
function countAllChildren(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return 0;

  return node.children.reduce((acc, child) => {
    return acc + 1 + countAllChildren(child);
  }, 0);
}

// Helper: Listar todos os filhos recursivamente
function listAllChildren(node: TreeNode): TreeNode[] {
  if (!node.children || node.children.length === 0) return [];

  const result: TreeNode[] = [];
  for (const child of node.children) {
    result.push(child);
    result.push(...listAllChildren(child));
  }
  return result;
}

// Helper: Coletar todos os IDs de filhos recursivamente
function collectChildrenIds(node: TreeNode): string[] {
  const ids: string[] = [];
  if (node.children) {
    node.children.forEach(child => {
      ids.push(child.id);
      ids.push(...collectChildrenIds(child));
    });
  }
  return ids;
}

function TreeNodeComponent({ 
  node, 
  onEdit, 
  onDelete,
  onUpdate,
  selectionMode,
  selectedIds,
  onSelectionChange,
}: { 
  node: TreeNode; 
  onEdit: (system: System) => void; 
  onDelete: (id: string, name: string) => void;
  onUpdate: () => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedIds?.has(node.id) || false;

  const handleCheckboxChange = (checked: boolean) => {
    if (!onSelectionChange || !selectedIds) return;

    const newSelectedIds = new Set(selectedIds);
    
    if (checked) {
      // Adicionar nó e todos os filhos
      newSelectedIds.add(node.id);
      collectChildrenIds(node).forEach(id => newSelectedIds.add(id));
    } else {
      // Remover nó e todos os filhos
      newSelectedIds.delete(node.id);
      collectChildrenIds(node).forEach(id => newSelectedIds.delete(id));
    }
    
    onSelectionChange(newSelectedIds);
  };

  // Auto-save com debounce de 500ms
  useEffect(() => {
    if (!editingId || editingName === node.name || editingName.trim() === '') return;
    
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const response = await fetch(`${API_BASE}/api/v1/systems/admin/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ name: editingName.trim() }),
        });

        if (response.ok) {
          toast.success('Nome atualizado!');
          onUpdate();
          setEditingId(null);
        } else {
          const data = await response.json();
          toast.error(data.error || 'Erro ao atualizar nome');
          setEditingName(node.name); // Reverter
        }
      } catch (error) {
        console.error('[TreeNode] Erro ao atualizar nome:', error);
        toast.error('Erro ao atualizar nome');
        setEditingName(node.name); // Reverter
      } finally {
        setSaving(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [editingName, editingId, node.name, onUpdate]);

  const handleDoubleClick = () => {
    setEditingId(node.id);
    setEditingName(node.name);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setEditingId(null);
      setEditingName(node.name);
    } else if (e.key === 'Enter') {
      e.currentTarget.blur(); // Força save imediato
    }
  };

  const handleDelete = async () => {
    const childrenCount = countAllChildren(node);

    if (childrenCount > 0) {
      const children = listAllChildren(node);
      const confirmMsg = `⚠️ ATENÇÃO

Você está deletando "${node.name}"

Isso também irá deletar ${childrenCount} item(ns) filho(s):

${children.map(c => `  • ${c.name} (${c.node_type})`).join('\n')}

Esta ação é IRREVERSÍVEL.

Digite "DELETAR" para confirmar:`;

      const input = prompt(confirmMsg);
      if (input !== 'DELETAR') return;
    } else {
      if (!confirm(`Deletar "${node.name}"? Esta ação não pode ser desfeita.`)) return;
    }

    await onDelete(node.id, node.name);
    onUpdate(); // Atualizar árvore após deletar
  };

  return (
    <div>
      {/* Nó atual */}
      <div
        className="bg-[#1B2A4A]/50 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors flex items-center justify-between mb-2"
        style={{ marginLeft: `${(node.depth || 0) * 24}px` }}
      >
        <div 
          className="flex items-center gap-3 flex-1 cursor-pointer"
          onClick={() => hasChildren && !selectionMode && setIsOpen(!isOpen)}
        >
          {/* Checkbox (modo seleção) */}
          {selectionMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleCheckboxChange(e.target.checked);
              }}
              className="w-5 h-5 rounded border-white/20 bg-[#0F1A2E] text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            />
          )}

          {/* Botão expandir/colapsar */}
          {hasChildren ? (
            <button
              className="text-white/60 hover:text-white transition-colors"
              onClick={(e) => {
                if (selectionMode) {
                  e.stopPropagation();
                  setIsOpen(!isOpen);
                }
              }}
            >
              {isOpen ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          ) : (
            <div className="w-5" /> // Espaçamento para alinhar
          )}

          {/* Informações do sistema */}
          <div className="flex-1">
            {editingId === node.id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (editingName.trim() === '') {
                    setEditingName(node.name);
                  }
                  setEditingId(null);
                }}
                autoFocus
                className="text-lg font-bold text-white bg-[#0F1A2E] border border-blue-500 rounded px-2 py-1 focus:outline-none w-full"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h3 
                className="text-lg font-bold text-white"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClick();
                }}
                title="Duplo clique para editar"
              >
                {node.name}
                {saving && <span className="ml-2 text-xs text-blue-400">salvando...</span>}
                {hasChildren && (
                  <span className="ml-2 text-sm text-white/40">
                    ({node.children!.length} {node.children!.length === 1 ? 'filho' : 'filhos'})
                  </span>
                )}
              </h3>
            )}
            <p className="text-sm text-white/60">
              Slug: {node.slug} | 
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-white/10">
                {node.node_type}
              </span>
            </p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node);
            }}
            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            title="Editar"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            title="Deletar"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filhos (recursivo) */}
      {isOpen && hasChildren && (
        <div className="ml-6">
          {node.children!.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onUpdate={onUpdate}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onSelectionChange={onSelectionChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SystemsTree({ systems, onEdit, onDelete, onUpdate, selectionMode, selectedIds, onSelectionChange }: SystemsTreeProps) {
  if (systems.length === 0) {
    return (
      <div className="text-center py-12 text-white/50">
        Nenhum sistema encontrado
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {systems.map((system) => (
        <TreeNodeComponent
          key={system.id}
          node={system}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdate={onUpdate}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
        />
      ))}
    </div>
  );
}
