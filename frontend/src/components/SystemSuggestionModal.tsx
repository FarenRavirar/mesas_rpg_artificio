import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

interface SystemSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SystemSuggestionModal = ({ isOpen, onClose, onSuccess }: SystemSuggestionModalProps) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [suggestionType, setSuggestionType] = useState<'system' | 'edition' | 'variant' | 'subsystem'>('system');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/system-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          parent_id: parentId.trim() || null,
          suggestion_type: suggestionType,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao enviar sugestão');
      }

      setName('');
      setDescription('');
      setParentId('');
      setSuggestionType('system');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#1B2A4A] border border-white/10 rounded-lg shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Sugerir Sistema</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <p className="text-white/70 text-sm mb-6">
            Sugira um novo sistema, edição ou variante. Sua sugestão será revisada por um administrador.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Tipo de Sugestão
              </label>
              <select
                value={suggestionType}
                onChange={(e) => setSuggestionType(e.target.value as any)}
                className="w-full px-4 py-2 bg-[#0F1A2E] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-artificio-orange)]"
              >
                <option value="system">Novo Sistema</option>
                <option value="edition">Edição de Sistema Existente</option>
                <option value="variant">Variante de Sistema</option>
                <option value="subsystem">Subsistema</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Nome do Sistema *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ex: Dungeons & Dragons 5e"
                className="w-full px-4 py-2 bg-[#0F1A2E] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-artificio-orange)]"
              />
            </div>

            <div>
              <label className="block text-white font-semibold mb-2 text-sm">
                Descrição (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Informações adicionais sobre o sistema..."
                rows={4}
                className="w-full px-4 py-2 bg-[#0F1A2E] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-artificio-orange)] resize-none"
              />
            </div>

            {suggestionType !== 'system' && (
              <div>
                <label className="block text-white font-semibold mb-2 text-sm">
                  ID do Sistema Pai (opcional)
                </label>
                <input
                  type="text"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  placeholder="UUID do sistema existente"
                  className="w-full px-4 py-2 bg-[#0F1A2E] border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-artificio-orange)]"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-transparent border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 px-4 py-2 bg-[var(--color-artificio-orange)] text-white font-semibold rounded-lg hover:bg-[var(--color-artificio-orange)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar Sugestão'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
