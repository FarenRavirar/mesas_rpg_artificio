import { useRef, useState, type ChangeEvent } from 'react';
import avatarPlaceholder from '../assets/avatar_placeholder.webp';

interface AvatarUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onError: (hasError: boolean) => void;
  hasError?: boolean;
  idPrefix?: string;
}

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AvatarUploader({
  label,
  value,
  onChange,
  onError,
  hasError = false,
  idPrefix = 'avatar-uploader',
}: AvatarUploaderProps) {
  const inputId = `${idPrefix}-file`;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
  const uploadEndpoint = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1$/, '') + '/api/v1';

  const isCloudinaryConfigured = cloudName.length > 0;
  const previewSource = value.trim() || avatarPlaceholder;

  const clearError = () => {
    setUploadError(null);
    onError(false);
  };

  const setError = (message: string) => {
    setUploadError(message);
    onError(true);
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!isCloudinaryConfigured) {
      setError('Cloudinary não configurado.');
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Formato inválido. Envie apenas JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Arquivo muito grande (${formatFileSize(file.size)}). Limite de 2 MB.`);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok || !payload?.secure_url) {
        throw new Error(payload?.error || 'Falha ao enviar imagem.');
      }

      onChange(payload.secure_url as string);
      onError(false);
      setUploadError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Falha inesperada no upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      <label className="text-sm font-medium text-white/70">
        {label}
      </label>

      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
          <img
            src={previewSource}
            alt="Preview do avatar"
            className="w-full h-full object-cover"
            onError={(event) => {
              const img = event.currentTarget;
              if (img.dataset.fallbackApplied === 'true') return;
              img.dataset.fallbackApplied = 'true';
              img.src = avatarPlaceholder;
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-lg bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
          >
            {isUploading ? 'Enviando...' : 'Enviar foto'}
          </button>

          <span className="text-xs text-white/60">
            até 2 MB
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-white/70">
          URL manual (fallback)
        </label>
        <input
          type="url"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            clearError();
          }}
          placeholder="https://res.cloudinary.com/..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 focus:ring-1 focus:ring-[var(--color-artificio-orange)]/30 transition-all"
        />
      </div>

      {(uploadError || hasError) && (
        <p className="text-xs text-red-300" role="alert">
          {uploadError || 'Não foi possível validar a imagem enviada.'}
        </p>
      )}
    </section>
  );
}