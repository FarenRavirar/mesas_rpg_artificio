import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface SystemEditModalProps {
  system: {
    id: string;
    name: string;
    slug: string;
    node_type: 'system' | 'edition' | 'variant';
    parent_id: string | null;
    aliases?: string[];
  } | null;
  systemsTree: any[];
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

const slugify = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const SystemEditModal = ({ system, systemsTree, token, onClose, onSuccess }: SystemEditModalProps) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [nodeType, setNodeType] = useState<'system' | 'edition' | 'variant'>('system');
  const [parentId, setParentId] = useState<string>('');
  const [aliases, setAliases] = useState<string[]>([]);
  const [aliasInput, setAliasInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (system) {
      setName(system.name);
      setSlug(system.slug);
      setNodeType(system.node_type);
      setParentId(system.parent_id || '');
      setAliases(system.aliases || []);
    }
  }, [system]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!system) {
      // Auto-gerar slug apenas ao criar
      setSlug(slugify(value));
    }
  };

  const handleAddAlias = () => {
    const trimmed = aliasInput.trim();
    if (trimmed && !aliases.includes(trimmed)) {
      setAliases([...aliases, trimmed]);
      setAliasInput('');
    }
  };

  const handleRemoveAlias = (index: number) => {
    setAliases(aliases.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    if ((nodeType === 'edition' || nodeType === 'variant') && !parentId) {
      toast.error('Edições e variantes precisam de um sistema pai');
      return;
    }

    setLoading(true);

    try {
      const url = system
        ? `${API_BASE}/api/v1/admin/systems/${system.id}`
        : `${API_BASE}/api/v1/admin/systems`;

      const method = system ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          node_type: nodeType,
          parent_id: parentId || null,
          aliases,
        }),
      });

      if (response.ok) {
        toast.success(system ? 'Sistema atualizado!' : 'Sistema criado!');
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao salvar sistema');
      }
    } catch (error) {
      console.error('[SystemEditModal]', error);
      toast.error('Erro ao salvar sistema');
    } finally {
      setLoading(false);
    }
  };

  // Flatten systems tree para dropdown
  const flattenSystems = (nodes: any[], depth = 0): any[] => {
    let result: any[] = [];
    for (const node of nodes) {
      result.push({ ...node, depth });
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenSystems(node.children, depth + 1));
      }
    }
    return result;
  };

  const flatSystems = flattenSystems(systemsTree).filter(
    (s) => !system || s.id !== system.id // Não permitir selecionar a si mesmo como pai
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className="bg-[#1B2A4A] border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1B2A4A] border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {system ? 'Editar Sistema' : 'Criar Sistema'}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Nome <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-3 bg-[#0F1A2E] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              placeholder="Ex: Dungeons & Dragons"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Slug <span className="text-white/40 text-xs">(gerado automaticamente)</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-3 bg-[#0F1A2E] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              placeholder="dungeons-dragons"
              disabled={!!system}
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Tipo <span className="text-red-400">*</span>
            </label>
            <select
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value as any)}
              className="w-full px-4 py-3 bg-[#0F1A2E] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="system">Sistema Base</option>
              <option value="edition">Edição</option>
              <option value="variant">Variante</option>
            </select>
          </div>

          {/* Sistema Pai */}
          {(nodeType === 'edition' || nodeType === 'variant') && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Sistema Pai <span className="text-red-400">*</span>
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-4 py-3 bg-[#0F1A2E] border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Selecione...</option>
                {flatSystems.map((sys) => (
                  <option key={sys.id} value={sys.id}>
                    {'—'.repeat(sys.depth)} {sys.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Aliases */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Aliases (nomes alternativos)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAlias();
                  }
                }}
                className="flex-1 px-4 py-2 bg-[#0F1A2E] border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                placeholder="Ex: D&D"
              />
              <button
                type="button"
                onClick={handleAddAlias}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
            {aliases.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aliases.map((alias, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm text-white"
                  >
                    {alias}
                    <button
                      type="button"
                      onClick={() => handleRemoveAlias(index)}
                      className="text-white/60 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Salvando...' : system ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
