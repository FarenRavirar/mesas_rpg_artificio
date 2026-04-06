import { useState } from 'react';
import toast from 'react-hot-toast';
import type { MasterViewModel } from '../types/masterView.types';

interface MasterActionsProps {
  vm: MasterViewModel;
  onAvatarUpdate?: (url: string) => Promise<void>;
}

/**
 * Validação de URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
}

/**
 * Ações contextuais do perfil
 * 
 * Responsabilidades:
 * - Mostrar ações apenas para o dono (isOwner)
 * - Editar perfil
 * - Trocar foto (URL externa)
 * - Preview imediato da foto
 * - Validação de URL
 * - Optimistic update
 */
export function MasterActions({ vm, onAvatarUpdate }: MasterActionsProps) {
  const [showAvatarInput, setShowAvatarInput] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  if (!vm.isOwner) return null;

  const handleAvatarUpdate = async () => {
    if (!avatarUrl.trim()) {
      toast.error('Digite uma URL válida');
      return;
    }

    if (!isValidUrl(avatarUrl)) {
      toast.error('URL inválida. Use http:// ou https://');
      return;
    }
    
    if (!onAvatarUpdate) return;
    
    setUpdating(true);
    
    // Optimistic update
    setPreviewAvatar(avatarUrl);
    
    try {
      await onAvatarUpdate(avatarUrl);
      toast.success('Foto atualizada com sucesso!');
      setShowAvatarInput(false);
      setAvatarUrl('');
      setPreviewAvatar(null);
    } catch (error) {
      console.error('Erro ao atualizar avatar:', error);
      toast.error('Erro ao atualizar foto. Tente novamente.');
      // Reverter optimistic update
      setPreviewAvatar(null);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setShowAvatarInput(false);
    setAvatarUrl('');
    setPreviewAvatar(null);
  };

  // Preview imediato
  const displayAvatar = previewAvatar || (avatarUrl && isValidUrl(avatarUrl) ? avatarUrl : vm.avatar);

  return (
    <div className="space-y-3">
      {/* Preview do avatar */}
      {showAvatarInput && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <img
            src={displayAvatar}
            alt="Preview"
            className="w-16 h-16 rounded-full object-cover border-2 border-white/20"
            onError={(e) => {
              e.currentTarget.src = vm.avatar;
            }}
          />
          <p className="text-sm text-white/60">Preview da nova foto</p>
        </div>
      )}

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
            placeholder="Cole a URL da imagem (https://...)"
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          <button
            onClick={handleAvatarUpdate}
            disabled={!avatarUrl.trim() || updating}
            className="px-4 py-2 rounded-lg bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {updating ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            onClick={handleCancel}
            disabled={updating}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
