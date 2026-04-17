import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { AvatarUploader } from '../../components/AvatarUploader';
import { ImageUploader } from '../../components/ImageUploader';
import { SystemTreeSelector } from '../../components/SystemTreeSelector';
import type { SystemTreeNode } from '../../types/systems';

const API_BASE = import.meta.env.VITE_API_URL || '';

const SELLING_POINT_ICON_OPTIONS = [
  'clock',
  'monitor',
  'coins',
  'sparkles',
  'shield',
  'heart',
  'zap',
  'users',
  'trophy',
  'headphones',
  'mic',
  'video',
  'film',
  'book',
] as const;

interface SellingPointPayload {
  icon: string;
  title: string;
  description: string;
  highlight?: string | null;
}

export interface EditableGmProfile {
  nickname: string | null;
  bio_long: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  languages: string[];
  specialties: string[];
  tagline: string | null;
  promo_badge_text: string | null;
  selling_points?: SellingPointPayload[] | null;
  closed_group_enabled?: boolean | null;
  closed_group_systems?: string[] | null;
  closed_group_description?: string | null;
  closed_group_min_price_cents?: number | null;
}

interface SellingPointFormState {
  icon: string;
  title: string;
  description: string;
  highlight: string;
}

interface EditGmProfileFormProps {
  profile: EditableGmProfile;
  onSuccess: () => void;
  onCancel: () => void;
}

const normalizeTag = (value: string): string => value.trim();

const flattenSystemsTree = (nodes: SystemTreeNode[]): SystemTreeNode[] => {
  const result: SystemTreeNode[] = [];

  const visit = (list: SystemTreeNode[]) => {
    for (const node of list) {
      result.push(node);
      if (node.children.length > 0) {
        visit(node.children);
      }
    }
  };

  visit(nodes);
  return result;
};

const toCurrencyInputValue = (cents: number | null | undefined): string => {
  if (typeof cents !== 'number' || Number.isNaN(cents)) return '';
  return (cents / 100).toFixed(2);
};

export function EditGmProfileForm({ profile, onSuccess, onCancel }: EditGmProfileFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nickname, setNickname] = useState(profile.nickname ?? '');
  const [tagline, setTagline] = useState(profile.tagline ?? '');
  const [bioLong, setBioLong] = useState(profile.bio_long ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url ?? '');
  const [promoBadgeText, setPromoBadgeText] = useState(profile.promo_badge_text ?? '');

  const [languages, setLanguages] = useState<string[]>(profile.languages ?? []);
  const [specialties, setSpecialties] = useState<string[]>(profile.specialties ?? []);
  const [languageInput, setLanguageInput] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');

  const [sellingPoints, setSellingPoints] = useState<SellingPointFormState[]>(
    (profile.selling_points ?? []).map((point) => ({
      icon: point.icon || 'sparkles',
      title: point.title || '',
      description: point.description || '',
      highlight: point.highlight ?? '',
    }))
  );

  const [closedGroupEnabled, setClosedGroupEnabled] = useState(Boolean(profile.closed_group_enabled));
  const [closedGroupSystems, setClosedGroupSystems] = useState<string[]>(profile.closed_group_systems ?? []);
  const [closedGroupDescription, setClosedGroupDescription] = useState(profile.closed_group_description ?? '');
  const [closedGroupMinPriceReais, setClosedGroupMinPriceReais] = useState(
    toCurrencyInputValue(profile.closed_group_min_price_cents)
  );

  const [systemsTree, setSystemsTree] = useState<SystemTreeNode[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(true);
  const [systemsSearch, setSystemsSearch] = useState('');

  const [avatarHasError, setAvatarHasError] = useState(false);
  const [bannerHasError, setBannerHasError] = useState(false);

  useEffect(() => {
    const fetchSystemsTree = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/systems?view=tree`);
        if (!res.ok) {
          throw new Error('Erro ao carregar sistemas.');
        }

        const payload = await res.json();
        setSystemsTree(Array.isArray(payload?.data) ? payload.data : []);
      } catch {
        setSystemsTree([]);
      } finally {
        setSystemsLoading(false);
      }
    };

    fetchSystemsTree();
  }, []);

  const systemsById = useMemo(() => {
    const map = new Map<string, string>();
    const all = flattenSystemsTree(systemsTree);

    for (const node of all) {
      map.set(node.id, node.name_pt || node.name);
    }

    return map;
  }, [systemsTree]);

  const addTag = (
    value: string,
    current: string[],
    setter: (next: string[]) => void,
    clearInput: () => void
  ) => {
    const normalized = normalizeTag(value);
    if (!normalized) return;

    const exists = current.some((item) => item.toLowerCase() === normalized.toLowerCase());
    if (!exists) {
      setter([...current, normalized]);
    }

    clearInput();
  };

  const removeTag = (index: number, current: string[], setter: (next: string[]) => void) => {
    setter(current.filter((_, currentIndex) => currentIndex !== index));
  };

  const toggleClosedGroupSystem = (systemId: string) => {
    setClosedGroupSystems((prev) =>
      prev.includes(systemId) ? prev.filter((id) => id !== systemId) : [...prev, systemId]
    );
  };

  const addSellingPoint = () => {
    setSellingPoints((prev) => [
      ...prev,
      {
        icon: 'sparkles',
        title: '',
        description: '',
        highlight: '',
      },
    ]);
  };

  const updateSellingPoint = (index: number, field: keyof SellingPointFormState, value: string) => {
    setSellingPoints((prev) =>
      prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    );
  };

  const removeSellingPoint = (index: number) => {
    setSellingPoints((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const parseClosedGroupPrice = (): number | null => {
    const normalizedValue = closedGroupMinPriceReais.trim().replace(',', '.');
    if (!normalizedValue) return null;

    const value = Number.parseFloat(normalizedValue);
    if (Number.isNaN(value) || value < 0) {
      throw new Error('Valor mínimo do grupo fechado inválido.');
    }

    return Math.round(value * 100);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      const safeNickname = nickname.trim();
      if (safeNickname.length < 2 || safeNickname.length > 40) {
        throw new Error('Nickname inválido. Use entre 2 e 40 caracteres.');
      }

      if (tagline.trim().length > 200) {
        throw new Error('Tagline muito longa (máximo 200 caracteres).');
      }

      if (promoBadgeText.trim().length > 120) {
        throw new Error('Texto do selo promocional muito longo (máximo 120 caracteres).');
      }

      const normalizedSellingPoints = sellingPoints.map((point, index) => {
        const title = point.title.trim();
        const description = point.description.trim();

        if (!title || !description) {
          throw new Error(`Benefício ${index + 1} incompleto. Preencha título e descrição.`);
        }

        const safeIcon = SELLING_POINT_ICON_OPTIONS.includes(point.icon as (typeof SELLING_POINT_ICON_OPTIONS)[number])
          ? point.icon
          : 'sparkles';

        return {
          icon: safeIcon,
          title,
          description,
          highlight: point.highlight.trim() || undefined,
        };
      });

      const safeLanguages = languages.map((item) => item.trim()).filter(Boolean);
      const safeSpecialties = specialties.map((item) => item.trim()).filter(Boolean);

      const payload = {
        nickname: safeNickname,
        tagline: tagline.trim() || null,
        bio_long: bioLong.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        banner_url: bannerUrl.trim() || null,
        promo_badge_text: promoBadgeText.trim() || null,
        selling_points: normalizedSellingPoints,
        languages: safeLanguages,
        specialties: safeSpecialties,
        closed_group_enabled: closedGroupEnabled,
        closed_group_systems: closedGroupEnabled ? closedGroupSystems : [],
        closed_group_description: closedGroupEnabled ? (closedGroupDescription.trim() || null) : null,
        closed_group_min_price_cents: closedGroupEnabled ? parseClosedGroupPrice() : null,
      };

      const response = await fetch(`${API_BASE}/api/v1/gm/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Erro ao salvar perfil.');
      }

      toast.success('Perfil atualizado com sucesso!');
      onSuccess();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Erro ao salvar perfil.';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Dados pessoais</h2>
          <button
            id="btn-editar-perfil-voltar"
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor="gm-edit-nickname" className="text-sm font-medium text-white/70">Nickname</label>
            <input
              id="gm-edit-nickname"
              type="text"
              minLength={2}
              maxLength={40}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60"
              placeholder="Seu nome público"
              required
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor="gm-edit-tagline" className="text-sm font-medium text-white/70">Tagline</label>
            <textarea
              id="gm-edit-tagline"
              rows={2}
              maxLength={200}
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 resize-none"
              placeholder="Uma frase curta sobre o seu estilo de mestragem"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor="gm-edit-bio" className="text-sm font-medium text-white/70">Bio longa</label>
            <textarea
              id="gm-edit-bio"
              rows={6}
              value={bioLong}
              onChange={(event) => setBioLong(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60"
              placeholder="Conte sua experiência e abordagem como mestre"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AvatarUploader
            idPrefix="gm-edit-avatar"
            label="Avatar"
            value={avatarUrl}
            onChange={setAvatarUrl}
            onError={setAvatarHasError}
            hasError={avatarHasError}
          />

          <ImageUploader
            idPrefix="gm-edit-banner"
            label="Banner"
            value={bannerUrl}
            onChange={setBannerUrl}
            onError={setBannerHasError}
            hasError={bannerHasError}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h2 className="text-xl font-semibold">Apresentação</h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="gm-edit-promo-badge" className="text-sm font-medium text-white/70">Texto do selo promocional</label>
          <input
            id="gm-edit-promo-badge"
            type="text"
            maxLength={120}
            value={promoBadgeText}
            onChange={(event) => setPromoBadgeText(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60"
            placeholder="Ex: Mais de 100 sessões narradas"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/60">Benefícios</h3>
            <button
              id="btn-gm-edit-add-selling-point"
              type="button"
              onClick={addSellingPoint}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-artificio-orange)]/40 bg-[var(--color-artificio-orange)]/10 px-3 py-1.5 text-sm text-white hover:bg-[var(--color-artificio-orange)]/20"
            >
              <Plus className="h-4 w-4" />
              Adicionar benefício
            </button>
          </div>

          {sellingPoints.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/60">
              Nenhum benefício cadastrado.
            </p>
          )}

          {sellingPoints.map((point, index) => (
            <div key={`selling-point-${index}`} className="rounded-xl border border-white/10 bg-[#0f1930] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/70">Benefício {index + 1}</p>
                <button
                  id={`btn-gm-edit-remove-selling-point-${index}`}
                  type="button"
                  onClick={() => removeSellingPoint(index)}
                  className="inline-flex items-center gap-1 text-xs text-red-200 hover:text-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor={`gm-edit-selling-icon-${index}`} className="text-xs text-white/60">Ícone</label>
                  <select
                    id={`gm-edit-selling-icon-${index}`}
                    value={point.icon}
                    onChange={(event) => updateSellingPoint(index, 'icon', event.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-artificio-orange)]/60"
                  >
                    {SELLING_POINT_ICON_OPTIONS.map((icon) => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor={`gm-edit-selling-highlight-${index}`} className="text-xs text-white/60">Highlight (opcional)</label>
                  <input
                    id={`gm-edit-selling-highlight-${index}`}
                    type="text"
                    value={point.highlight}
                    onChange={(event) => updateSellingPoint(index, 'highlight', event.target.value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-artificio-orange)]/60"
                    placeholder="Ex: 95% aprovação"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`gm-edit-selling-title-${index}`} className="text-xs text-white/60">Título</label>
                <input
                  id={`gm-edit-selling-title-${index}`}
                  type="text"
                  value={point.title}
                  onChange={(event) => updateSellingPoint(index, 'title', event.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-artificio-orange)]/60"
                  placeholder="Resumo curto do benefício"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={`gm-edit-selling-description-${index}`} className="text-xs text-white/60">Descrição</label>
                <textarea
                  id={`gm-edit-selling-description-${index}`}
                  rows={3}
                  value={point.description}
                  onChange={(event) => updateSellingPoint(index, 'description', event.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-artificio-orange)]/60 resize-none"
                  placeholder="Explique este diferencial"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h2 className="text-xl font-semibold">Idiomas e especialidades</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="gm-edit-language-input" className="text-sm font-medium text-white/70">Idiomas</label>
            <div className="flex gap-2">
              <input
                id="gm-edit-language-input"
                type="text"
                value={languageInput}
                onChange={(event) => setLanguageInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault();
                    addTag(languageInput, languages, setLanguages, () => setLanguageInput(''));
                  }
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-artificio-orange)]/60"
                placeholder="Ex: Português"
              />
              <button
                id="btn-gm-edit-add-language"
                type="button"
                onClick={() => addTag(languageInput, languages, setLanguages, () => setLanguageInput(''))}
                className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/80 hover:text-white"
              >
                Adicionar
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {languages.map((tag, index) => (
                <button
                  key={`language-${tag}-${index}`}
                  id={`btn-gm-edit-remove-language-${index}`}
                  type="button"
                  onClick={() => removeTag(index, languages, setLanguages)}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90 hover:bg-white/20"
                >
                  {tag} ×
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="gm-edit-specialty-input" className="text-sm font-medium text-white/70">Especialidades</label>
            <div className="flex gap-2">
              <input
                id="gm-edit-specialty-input"
                type="text"
                value={specialtyInput}
                onChange={(event) => setSpecialtyInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault();
                    addTag(specialtyInput, specialties, setSpecialties, () => setSpecialtyInput(''));
                  }
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--color-artificio-orange)]/60"
                placeholder="Ex: Campanhas longas"
              />
              <button
                id="btn-gm-edit-add-specialty"
                type="button"
                onClick={() => addTag(specialtyInput, specialties, setSpecialties, () => setSpecialtyInput(''))}
                className="rounded-lg border border-white/20 px-3 py-2 text-xs text-white/80 hover:text-white"
              >
                Adicionar
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {specialties.map((tag, index) => (
                <button
                  key={`specialty-${tag}-${index}`}
                  id={`btn-gm-edit-remove-specialty-${index}`}
                  type="button"
                  onClick={() => removeTag(index, specialties, setSpecialties)}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90 hover:bg-white/20"
                >
                  {tag} ×
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <h2 className="text-xl font-semibold">Grupo fechado</h2>

        <label className="inline-flex items-center gap-2 text-sm text-white/80">
          <input
            id="gm-edit-closed-group-enabled"
            type="checkbox"
            checked={closedGroupEnabled}
            onChange={(event) => setClosedGroupEnabled(event.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5"
          />
          Aceitar grupos fechados
        </label>

        {closedGroupEnabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/70">Sistemas aceitos para grupo fechado</p>
              {systemsLoading ? (
                <p className="text-sm text-white/50">Carregando sistemas...</p>
              ) : (
                <SystemTreeSelector
                  tree={systemsTree}
                  selectedIds={closedGroupSystems}
                  onToggle={toggleClosedGroupSystem}
                  search={systemsSearch}
                  onSearchChange={setSystemsSearch}
                  idPrefix="gm-edit-closed-group-system"
                  singleSelect={false}
                />
              )}

              {closedGroupSystems.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {closedGroupSystems.map((systemId) => (
                    <button
                      key={systemId}
                      id={`btn-gm-edit-remove-closed-system-${systemId}`}
                      type="button"
                      onClick={() => toggleClosedGroupSystem(systemId)}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/90 hover:bg-white/20"
                    >
                      {systemsById.get(systemId) || 'Sistema'} ×
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="gm-edit-closed-group-description" className="text-sm font-medium text-white/70">Descrição do grupo fechado</label>
              <textarea
                id="gm-edit-closed-group-description"
                rows={4}
                value={closedGroupDescription}
                onChange={(event) => setClosedGroupDescription(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60"
                placeholder="Descreva para que tipo de grupo esse formato é ideal"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="gm-edit-closed-group-min-price" className="text-sm font-medium text-white/70">Preço mínimo (R$)</label>
              <input
                id="gm-edit-closed-group-min-price"
                type="number"
                min={0}
                step="0.01"
                value={closedGroupMinPriceReais}
                onChange={(event) => setClosedGroupMinPriceReais(event.target.value)}
                className="w-full max-w-xs rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60"
                placeholder="0.00"
              />
              <p className="text-xs text-white/50">Valor enviado em centavos no backend.</p>
            </div>
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-900/30 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          id="btn-gm-edit-cancel"
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 hover:text-white"
        >
          Cancelar
        </button>

        <button
          id="btn-gm-edit-save"
          type="submit"
          disabled={submitting || avatarHasError || bannerHasError}
          className="rounded-xl bg-[var(--color-artificio-orange)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-artificio-orange-hover)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}
