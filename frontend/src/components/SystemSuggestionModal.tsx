import React, { useState, useEffect } from 'react';
import { SystemTreeSelector } from './SystemTreeSelector';
import '../styles/suggestions.css';

interface SystemSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SystemSuggestionModal: React.FC<SystemSuggestionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [nodeType, setNodeType] = useState<'system' | 'edition' | 'variant' | 'subsystem'>('system');
  const [parentId, setParentId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [aliases, setAliases] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [parentHasEditions, setParentHasEditions] = useState(false);
  const [systemsTree, setSystemsTree] = useState<any[]>([]);
  const [systemSearch, setSystemSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPendingCount();
      fetchSystemsTree();
    }
  }, [isOpen]);

  useEffect(() => {
    if (parentId) {
      checkParentHasEditions(parentId);
    } else {
      setParentHasEditions(false);
    }
  }, [parentId]);

  const fetchPendingCount = async () => {
    try {
      const token = localStorage.getItem('@ArtificioMesas:token');
      const res = await fetch('/api/v1/system-suggestions/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const pending = data.data.filter((s: any) => s.status === 'pending');
        setPendingCount(pending.length);
      }
    } catch (err) {
      console.error('Erro ao buscar sugestões pendentes:', err);
    }
  };

  const fetchSystemsTree = async () => {
    try {
      const res = await fetch('/api/v1/systems/tree');
      if (res.ok) {
        const data = await res.json();
        setSystemsTree(data);
      }
    } catch (err) {
      console.error('Erro ao buscar árvore de sistemas:', err);
    }
  };

  const checkParentHasEditions = async (systemId: string) => {
    try {
      const res = await fetch(`/api/v1/systems/tree`);
      if (res.ok) {
        const data = await res.json();
        
        // Função recursiva para buscar em toda a árvore
        const findSystemAndCheckEditions = (nodes: any[], targetId: string): boolean => {
          for (const node of nodes) {
            if (node.id === targetId) {
              // Encontrou o sistema, verificar se tem filhos do tipo 'edition'
              return node.children.some((child: any) => child.node_type === 'edition');
            }
            // Buscar recursivamente nos filhos
            if (node.children && node.children.length > 0) {
              const found = findSystemAndCheckEditions(node.children, targetId);
              if (found !== null) return found;
            }
          }
          return false;
        };
        
        const hasEditions = findSystemAndCheckEditions(data, systemId);
        setParentHasEditions(hasEditions);
      }
    } catch (err) {
      console.error('Erro ao verificar edições:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pendingCount >= 5) {
      setError('Você já possui 5 sugestões pendentes. Aguarde a aprovação ou rejeição antes de enviar novas sugestões.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('@ArtificioMesas:token');
      const res = await fetch('/api/v1/system-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          node_type: nodeType,
          parent_id: parentId,
          description: description.trim() || null,
          aliases: aliases.trim() ? aliases.split(',').map(a => a.trim()) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao criar sugestão');
      }

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setNodeType('system');
    setParentId(null);
    setDescription('');
    setAliases('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const isLimitReached = pendingCount >= 5;
  const canAddEdition = parentId && !parentHasEditions;
  const canOnlyAddVariant = parentId && parentHasEditions;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Sugerir Novo Sistema</h2>
          <button onClick={handleClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {isLimitReached && (
            <div className="alert alert-warning">
              ⚠️ Você atingiu o limite de 5 sugestões pendentes. 
              Aguarde a aprovação ou rejeição antes de enviar novas sugestões.
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              ❌ {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Nome do Sistema *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Dungeons & Dragons"
              required
              disabled={isLimitReached}
            />
          </div>

          <div className="form-group">
            <label htmlFor="parent">Sistema Pai (opcional)</label>
            <div className="system-selector-wrapper">
              <SystemTreeSelector
                tree={systemsTree}
                selectedIds={parentId ? [parentId] : []}
                onToggle={(id) => setParentId(id)}
                search={systemSearch}
                onSearchChange={setSystemSearch}
                idPrefix="suggestion-modal"
                singleSelect
              />
            </div>
          </div>

          {canOnlyAddVariant && (
            <div className="alert alert-warning">
              ⚠️ Este sistema já possui edições publicadas. 
              Você só pode adicionar <strong>Variantes</strong>.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="nodeType">Tipo *</label>
            <select
              id="nodeType"
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value as any)}
              required
              disabled={isLimitReached}
            >
              <option value="system">Sistema Raiz</option>
              <option value="edition" disabled={(!canAddEdition || canOnlyAddVariant) ? true : false}>
                Edição / Subsistema
              </option>
              <option value="variant">Variante</option>
            </select>
          </div>

          {nodeType === 'edition' && !canOnlyAddVariant && (
            <div className="alert alert-info">
              ℹ️ <strong>Edições</strong> são versões principais do sistema 
              (ex: D&D 5e, D&D 3.5e, Pathfinder 2e).
            </div>
          )}

          {nodeType === 'variant' && (
            <div className="alert alert-info">
              ℹ️ <strong>Variantes</strong> são adaptações ou cenários específicos 
              (ex: Eberron, Forgotten Realms, Dark Sun).
            </div>
          )}

          <div className="form-group">
            <label htmlFor="description">Descrição (opcional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do sistema"
              rows={3}
              disabled={isLimitReached}
            />
          </div>

          <div className="form-group">
            <label htmlFor="aliases">Abreviações (opcional)</label>
            <input
              id="aliases"
              type="text"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              placeholder="Ex: D&D, DnD (separados por vírgula)"
              disabled={isLimitReached}
            />
            <small className="form-hint">
              Aliases ajudam na busca. Separe múltiplos aliases por vírgula.
            </small>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={handleClose} className="btn-secondary">
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isSubmitting || isLimitReached}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Sugestão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
