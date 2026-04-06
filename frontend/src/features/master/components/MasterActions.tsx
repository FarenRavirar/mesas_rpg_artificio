import { useState } from 'react';
import type { MasterViewModel } from '../types/masterView.types';

interface MasterActionsProps {
  vm: MasterViewModel;
  onAvatarUpdate?: (url: string) => Promise<void>;
}

/**
 * Ações contextuais do perfil
 * 
 * Responsabilidades:
 * - Mostrar ações apenas para o dono (isOwner)
 * - Editar perfil
 * - Trocar foto (URL externa)
 * - Preview imediato da foto
 */
export function MasterActions({ vm, onAvatarUpdate }: MasterActionsProps) {
  const [showAvatarInput, setShowAvatarInput] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  if (!vm.isOwner) return null;

  const handleAvatarUpdate = async () => {
    if (!avatarUrl.trim() || !onAvatarUpdate) return;
    
    setUpdating(true);
    try {
      await onAvatarUpdate(avatarUrl);
      setShowAvatarInput(false);
      setAvatarUrl('');
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error);
      alert('Erro ao atualizar foto. Tente novamente.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <button className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors font-medium">
          ✏️ Editar perfil
        </button>
        
        <button
          onClick={() => setShowAvatarInput(!showAvatarInput)}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-medium"
        >
          🖼️ Trocar foto
        </button>
      </div>

      {showAvatarInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="Cole a URL da imagem"
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          <button
            onClick={handleAvatarUpdate}
            disabled={!avatarUrl.trim() || updating}
            className="px-4 py-2 rounded-lg bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {updating ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      )}
    </div>
  );
}
