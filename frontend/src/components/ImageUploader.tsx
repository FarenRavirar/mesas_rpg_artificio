import { useRef, useState, useCallback, type ChangeEvent } from 'react';
import { ImageEditor } from './ImageEditor';
import type { PixelCrop } from 'react-image-crop';
import bannerPlaceholder from '../assets/banner_placeholder.webp';

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onError: (hasError: boolean) => void;
  hasError?: boolean;
  idPrefix?: string;
  manualInputId?: string;
  fileInputId?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUploader({
  label,
  value,
  onChange,
  onError,
  hasError = false,
  idPrefix = 'image-uploader',
  manualInputId,
  fileInputId,
}: ImageUploaderProps) {
  const inputId = fileInputId || `${idPrefix}-file`;
  const manualUrlId = manualInputId || `${idPrefix}-url`;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string>('');
  const [cropData, setCropData] = useState<{
    crop: PixelCrop;
    originalWidth: number;
    originalHeight: number;
  } | null>(null);

  const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
  const uploadEndpoint = (import.meta.env.VITE_API_URL || '').replace(/\/api\/v1$/, '') + '/api/v1';

  const isCloudinaryConfigured = cloudName.length > 0;
  const previewSource = value.trim() || bannerPlaceholder;

  const clearError = () => {
    setUploadError(null);
    onError(false);
  };

  const setError = (message: string) => {
    setUploadError(message);
    onError(true);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!isCloudinaryConfigured) {
      setError('Cloudinary não configurado. Preencha VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET.');
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError('Formato inválido. Envie apenas JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Arquivo muito grande (${formatFileSize(file.size)}). Limite de 5 MB.`);
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setPendingImageUrl(imageUrl);
    setCropData(null);
    setShowEditor(true);
    clearError();
  };

  const handleCropComplete = useCallback((croppedAreaPixels: PixelCrop, originalWidth: number, originalHeight: number) => {
    setCropData({
      crop: croppedAreaPixels,
      originalWidth,
      originalHeight,
    });
  }, []);

  const handleConfirmCrop = async () => {
    if (!pendingFile) return;

    setIsUploading(true);
    setShowEditor(false);

    try {
      const formData = new FormData();
      formData.append('file', pendingFile);

      if (cropData) {
        formData.append('crop_x', String(Math.round(cropData.crop.x)));
        formData.append('crop_y', String(Math.round(cropData.crop.y)));
        formData.append('crop_width', String(Math.round(cropData.crop.width)));
        formData.append('crop_height', String(Math.round(cropData.crop.height)));
        formData.append('original_width', String(Math.round(cropData.originalWidth)));
        formData.append('original_height', String(Math.round(cropData.originalHeight)));
      }

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
      URL.revokeObjectURL(pendingImageUrl);
      setPendingFile(null);
      setPendingImageUrl('');
      setCropData(null);
    }
  };

  const handleCancelCrop = () => {
    setShowEditor(false);
    if (pendingImageUrl) {
      URL.revokeObjectURL(pendingImageUrl);
    }
    setPendingFile(null);
    setPendingImageUrl('');
    setCropData(null);
  };

  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      <label htmlFor={inputId} className="text-sm font-medium text-white/70">
        {label}
      </label>

      <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            id={`${idPrefix}-select-file`}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 rounded-lg bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            {isUploading ? 'Enviando imagem...' : 'Selecionar imagem'}
          </button>

          <span className="text-xs text-white/60">
            JPG, PNG ou WEBP até 5 MB
          </span>
        </div>

        {!isCloudinaryConfigured && (
          <p className="text-xs text-amber-300/90">
            Upload direto desativado: configure VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET.
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor={manualUrlId} className="text-xs font-medium text-white/70">
            URL manual (fallback)
          </label>
          <input
            id={manualUrlId}
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
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <img
          src={previewSource}
          alt={value ? 'Preview do banner informado' : 'Banner padrão aplicado automaticamente'}
          className="w-full max-h-52 object-cover"
          onError={(event) => {
            const img = event.currentTarget;
            if (img.dataset.fallbackApplied === 'true') return;
            img.dataset.fallbackApplied = 'true';
            img.src = bannerPlaceholder;
            setError('Não foi possível carregar a imagem informada. O banner padrão foi aplicado na prévia.');
          }}
        />
        <div className="bg-black/30 px-3 py-2 flex justify-between items-center">
          <span className="text-xs text-white/70">
            {value ? 'Banner personalizado em uso' : 'Banner padrão em uso'}
          </span>
          {value ? (
            <button
              id={`${idPrefix}-remove-image`}
              type="button"
              onClick={() => {
                onChange('');
                clearError();
              }}
              className="text-xs text-red-200 hover:text-red-100 transition-colors"
            >
              Remover imagem
            </button>
          ) : null}
        </div>
      </div>

      {(uploadError || hasError) && (
        <p className="text-xs text-red-300" role="alert">
          {uploadError || 'Não foi possível validar a imagem enviada.'}
        />
      )}

      {showEditor && (
        <ImageEditor
          imageSrc={pendingImageUrl}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
          onConfirm={handleConfirmCrop}
          aspect={1200 / 400}
        />
      )}
    </section>
  );
}
