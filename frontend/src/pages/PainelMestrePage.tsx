import { useEffect, useMemo, useState } from 'react';
import bannerPlaceholder from '../assets/banner_placeholder.webp';
import type { ChangeEvent, FormEvent, InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, ChevronRight, Dice1, Globe, MapPin, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SystemTreeSelector } from '../components/SystemTreeSelector';
import { ScenarioSelector } from '../components/ScenarioSelector';
import { SystemSuggestionModal } from '../components/SystemSuggestionModal';
import { ContactsFormBlock, type ContactFormEntry } from '../components/ContactsFormBlock';
import toast from 'react-hot-toast';
import type { SystemTreeNode } from '../types/systems';
import type { TableContact } from '../types/tables';

type TableStatus = 'draft' | 'active' | 'full' | 'cancelled' | 'ended' | 'pending_review';

const DDAL_ELIGIBLE_PATH = 'dungeons-dragons/5e/2024';

interface GmProfile {
  id: string;
  slug: string;
  nickname: string | null;
  bio_long: string | null;
  avatar_url: string | null;
  languages: string[];
  specialties: string[];
  tables_count: number;
  avg_rating: number | null;
}

interface MyTable {
  id: string;
  slug: string;
  title: string;
  status: TableStatus;
  modality: string;
  slots_total: number;
  slots_filled: number;
  system_name: string | null;
  publisher_role: 'gm' | 'announcer';
  actual_gm_name: string | null;
  contacts: TableContact[];
  is_ddal?: boolean;
  ddal_code?: string | null;
  ddal_name?: string | null;
  ddal_tier?: number | null;
  created_at: string;
}

interface FlattenedSystemNode {
  id: string;
  slug: string;
  name: string;
  path_slug: string | null;
  pathLabel: string;
}

interface CreateTableFormProps {
  token: string;
  onSuccess: () => void;
  initialData?: {
    title?: string;
    description?: string;
    type?: string;
    modality?: string;
    price_type?: string;
    slots_total?: string;
    language?: string;
    publisher_role?: 'gm' | 'announcer';
    actual_gm_name?: string;
    banner_url?: string;       // URL do banner (preenchimento automático)
    gm_avatar_url?: string;   // Avatar Discord do mestre (apenas visual)
    is_covil?: boolean;       // Detectado pelo parser, editável
    system_id?: string;
    scenario_id?: string;     // Novo campo
    starts_at?: string;
    frequency?: string;
    frequency_custom?: string;
    rules_notes?: string;
    contacts?: Array<{ channel: string; value: string; extra_url?: string }>;
  };
  mode?: 'create' | 'review';
  candidateId?: string;
}

interface DdalFormState {
  is_ddal: boolean;
  ddal_code: string;
  ddal_name: string;
  ddal_tier: string;
  ddal_season: string;
  ddal_duration: string;
  ddal_format: string;
  ddal_org_code: string;
  ddal_setting: string;
  ddal_rules_notes: string;
}

const flattenTree = (nodes: SystemTreeNode[], breadcrumb: string[] = []): FlattenedSystemNode[] => {
  const flattened: FlattenedSystemNode[] = [];

  for (const node of nodes) {
    const path = [...breadcrumb, node.name];
    flattened.push({
      id: node.id,
      slug: node.slug,
      name: node.name,
      path_slug: node.path_slug,
      pathLabel: path.join(' > '),
    });

    flattened.push(...flattenTree(node.children, path));
  }

  return flattened;
};

const slugifyFromNickname = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

function InputField({ label, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-white/70">{label}</label>
      <input
        id={id}
        {...props}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 focus:ring-1 focus:ring-[var(--color-artificio-orange)]/30 transition-all"
      />
    </div>
  );
}

function SelectField({ label, id, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-white/70">{label}</label>
      <select
        id={id}
        {...props}
        className="w-full bg-[#1B2A4A] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-artificio-orange)]/60 transition-all cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}

export function CreateTableForm({ token, onSuccess, initialData, mode = 'create', candidateId }: CreateTableFormProps) {
  const [systemsTree, setSystemsTree] = useState<SystemTreeNode[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(true);
  const [systemsError, setSystemsError] = useState<string | null>(null);
  const [systemSearch, setSystemSearch] = useState('');
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(initialData?.scenario_id || null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'campanha',
    audience: 'livre',
    modality: initialData?.modality || 'online',
    price_type: initialData?.price_type || 'gratuita',
    price_value: '',
    slots_total: initialData?.slots_total || '4',
    experience_level: 'todos',
    starts_at: '',
    language: initialData?.language || 'Português',
  });

  const [ddal, setDdal] = useState<DdalFormState>({
    is_ddal: false,
    ddal_code: '',
    ddal_name: '',
    ddal_tier: '',
    ddal_season: '',
    ddal_duration: '',
    ddal_format: '',
    ddal_org_code: '',
    ddal_setting: '',
    ddal_rules_notes: '',
  });

  const [publisherRole, setPublisherRole] = useState<'gm' | 'announcer'>(initialData?.publisher_role || 'gm');
  const [actualGmName, setActualGmName] = useState(initialData?.actual_gm_name || '');
  const [contacts, setContacts] = useState<ContactFormEntry[]>([
    {
      channel: 'whatsapp',
      value: '',
      label: '',
      discord_server_url: '',
    },
  ]);
  const [contactsError, setContactsError] = useState<string | null>(null);

  const [isOngoing, setIsOngoing] = useState(false);
  const [frequency, setFrequency] = useState(initialData?.frequency || '');
  const [frequencyCustom, setFrequencyCustom] = useState(initialData?.frequency_custom || '');
  const [rulesNotes, setRulesNotes] = useState(initialData?.rules_notes || '');
  const [bannerUrl, setBannerUrl] = useState(initialData?.banner_url || '');
  const [gmAvatarUrl] = useState(initialData?.gm_avatar_url || ''); // readonly, apenas visual
  const [isCovilMesa, setIsCovilMesa] = useState(initialData?.is_covil ?? false);
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const fetchSystemsTree = async () => {
    setSystemsLoading(true);
    setSystemsError(null);

    try {
      const res = await fetch('/api/v1/systems?view=tree');
      if (!res.ok) throw new Error('Erro ao carregar árvore de sistemas.');
      const json = await res.json();
      setSystemsTree(json.data ?? []);
    } catch (err: any) {
      setSystemsError(err.message ?? 'Erro ao carregar árvore de sistemas.');
    } finally {
      setSystemsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemsTree();
  }, []);

  const flattenedSystems = useMemo(() => flattenTree(systemsTree), [systemsTree]);

  const selectedSystem = useMemo(
    () => flattenedSystems.find((node) => node.id === selectedSystemId) ?? null,
    [flattenedSystems, selectedSystemId]
  );

  const isDdalEligibleSelection = useMemo(() => {
    if (!selectedSystem?.path_slug) return false;
    return selectedSystem.path_slug === DDAL_ELIGIBLE_PATH
      || selectedSystem.path_slug.startsWith(`${DDAL_ELIGIBLE_PATH}/`);
  }, [selectedSystem]);

  useEffect(() => {
    if (!isDdalEligibleSelection) {
      setDdal((prev) => {
        if (prev.is_ddal) {
          return { ...prev, is_ddal: false };
        }
        return prev;
      });
    }
  }, [isDdalEligibleSelection]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDdalChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDdal((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setContactsError(null);

    // Validação de título
    if (!form.title || form.title.trim() === '') {
      toast.error('Título é obrigatório');
      setError('Título é obrigatório');
      setLoading(false);
      return;
    }

    // Validação de sistema
    if (!selectedSystemId) {
      toast.error('Sistema é obrigatório. Selecione um sistema na árvore.');
      setError('Sistema é obrigatório');
      setLoading(false);
      return;
    }

    const sanitizedContacts = contacts
      .map((contact) => ({
        channel: contact.channel,
        value: contact.value.trim(),
        label: contact.label.trim(),
        discord_server_url: contact.discord_server_url.trim(),
      }))
      .filter((contact) => contact.value.length > 0)
      .map((contact) => ({
        ...contact,
        label: contact.label.length > 0 ? contact.label : null,
        discord_server_url: contact.channel === 'discord' && contact.discord_server_url.length > 0
          ? contact.discord_server_url
          : null,
      }));

    if (sanitizedContacts.length === 0) {
      toast.error('Informe pelo menos um canal de contato válido');
      setContactsError('Informe pelo menos um canal de contato válido para recrutamento.');
      setLoading(false);
      return;
    }

    const safeActualGmName = actualGmName.trim();
    if (publisherRole === 'announcer' && safeActualGmName.length < 2) {
      toast.error('Informe o nome do mestre real');
      setError('Quando for anunciante, informe o nome do mestre real.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        system_id: selectedSystemId || null,
        scenario_id: selectedScenarioId || null,
        price_value: form.price_value ? parseFloat(form.price_value) : null,
        slots_total: parseInt(form.slots_total, 10),
        starts_at: isOngoing ? null : (form.starts_at || null),
        publisher_role: publisherRole,
        actual_gm_name: publisherRole === 'announcer' ? safeActualGmName : null,
        contacts: sanitizedContacts,
        frequency: frequency || null,
        frequency_custom: frequency === 'outros' ? frequencyCustom : null,
        rules_notes: rulesNotes.trim() || null,
        banner_url: bannerUrl.trim() || null,
        is_covil: mode === 'review' ? isCovilMesa : false,
        is_ddal: isDdalEligibleSelection ? ddal.is_ddal : false,
        ddal_code: ddal.is_ddal ? ddal.ddal_code || null : null,
        ddal_name: ddal.is_ddal ? ddal.ddal_name || null : null,
        ddal_tier: ddal.is_ddal && ddal.ddal_tier ? Number(ddal.ddal_tier) : null,
        ddal_season: ddal.is_ddal ? ddal.ddal_season || null : null,
        ddal_duration: ddal.is_ddal ? ddal.ddal_duration || null : null,
        ddal_format: ddal.is_ddal ? ddal.ddal_format || null : null,
        ddal_org_code: ddal.is_ddal ? ddal.ddal_org_code || null : null,
        ddal_setting: ddal.is_ddal ? ddal.ddal_setting || null : null,
        ddal_rules_notes: ddal.is_ddal ? ddal.ddal_rules_notes || null : null,
      };

      const res = await fetch('/api/v1/gm/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Erro desconhecido');
      }

      // Se estiver em modo review, marcar candidato como aceito
      if (mode === 'review' && candidateId) {
        try {
          const acceptRes = await fetch(`/api/v1/aggregator/candidates/${candidateId}/accept`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          if (!acceptRes.ok) {
            console.error('Falha ao marcar candidato como aceito, mas mesa foi criada com sucesso');
          }
        } catch (acceptErr) {
          console.error('Erro ao marcar candidato como aceito:', acceptErr);
          // Não falhar a operação inteira se apenas a marcação falhar
        }
      }

      toast.success(mode === 'review' ? 'Candidato aprovado! Mesa criada com sucesso.' : 'Mesa publicada com sucesso!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <InputField
            label="Título da Mesa *"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ex: A Queda do Império Sombrio"
            required
          />
        </div>

        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-[#13213f]/60 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Dice1 className="w-4 h-4 text-[var(--color-artificio-orange)]" />
              Sistema da Mesa *
            </div>
            <button
              type="button"
              onClick={() => setShowSuggestionModal(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              + Adicionar Sistema
            </button>
          </div>

          {systemsLoading ? (
            <p className="text-sm text-white/60">Carregando árvore de sistemas...</p>
          ) : systemsError ? (
            <p className="text-sm text-red-300">{systemsError}</p>
          ) : (
            <SystemTreeSelector
              tree={systemsTree}
              selectedIds={selectedSystemId ? [selectedSystemId] : []}
              onToggle={(systemId) => {
                setSelectedSystemId(systemId);
                setSystemSearch(''); // Limpar busca ao selecionar
              }}
              search={systemSearch}
              onSearchChange={setSystemSearch}
              idPrefix="painel-mestre-systems"
              singleSelect
            />
          )}
        </div>

        {/* Cenário (opcional) */}
        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-[#13213f]/60 p-4 space-y-3">
          <div>
            <p className="text-sm font-semibold text-white">Cenário (opcional)</p>
            <p className="text-xs text-white/60 mt-1">
              Cenários são independentes de sistemas. Ex: Forgotten Realms pode ser jogado em D&D ou Pathfinder.
            </p>
          </div>

          <ScenarioSelector
            selectedScenarioId={selectedScenarioId}
            onSelect={setSelectedScenarioId}
            disabled={loading}
          />
        </div>

        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-[#13213f]/60 p-4 space-y-3" id="painel-mestre-publisher-role-block">
          <div>
            <p className="text-sm font-semibold text-white">Quem está publicando esta mesa?</p>
            <p className="text-xs text-white/60 mt-1">Você pode publicar como mestre narrador ou como apenas anunciante.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label htmlFor="publisher-role-gm" className={`rounded-xl border p-3 cursor-pointer transition-colors ${publisherRole === 'gm' ? 'border-[var(--color-artificio-orange)] bg-[var(--color-artificio-orange)]/10' : 'border-white/15 bg-white/5 hover:border-white/30'}`}>
              <input
                id="publisher-role-gm"
                type="radio"
                name="publisher_role"
                className="sr-only"
                checked={publisherRole === 'gm'}
                onChange={() => setPublisherRole('gm')}
              />
              <p className="text-sm font-semibold">Sou o mestre desta mesa</p>
              <p className="text-xs text-white/60 mt-1">Sem selo de anunciante.</p>
            </label>

            <label htmlFor="publisher-role-announcer" className={`rounded-xl border p-3 cursor-pointer transition-colors ${publisherRole === 'announcer' ? 'border-[var(--color-artificio-orange)] bg-[var(--color-artificio-orange)]/10' : 'border-white/15 bg-white/5 hover:border-white/30'}`}>
              <input
                id="publisher-role-announcer"
                type="radio"
                name="publisher_role"
                className="sr-only"
                checked={publisherRole === 'announcer'}
                onChange={() => setPublisherRole('announcer')}
              />
              <p className="text-sm font-semibold">Sou apenas anunciante</p>
              <p className="text-xs text-white/60 mt-1">A mesa exibirá o selo "Apenas anunciante".</p>
            </label>
          </div>

          {publisherRole === 'announcer' && (
            <InputField
              label="Nome do mestre real *"
              id="painel-mestre-actual-gm-name"
              name="actual_gm_name"
              value={actualGmName}
              onChange={(event) => setActualGmName(event.target.value)}
              placeholder="Ex: Mestre Arandur"
              required
            />
          )}
        </div>

        <SelectField label="Tipo de Mesa *" id="type" name="type" value={form.type} onChange={handleChange}>
          <option value="campanha">Campanha</option>
          <option value="one-shot">One-Shot</option>
          <option value="oneshot-serie">One-Shot em Série</option>
          <option value="aberta">Mesa Aberta</option>
        </SelectField>

        <SelectField label="Modalidade *" id="modality" name="modality" value={form.modality} onChange={handleChange}>
          <option value="online">Online</option>
          <option value="presencial">Presencial</option>
          <option value="hibrida">Híbrida</option>
        </SelectField>

        <SelectField label="Audiência" id="audience" name="audience" value={form.audience} onChange={handleChange}>
          <option value="livre">Livre (Todos os públicos)</option>
          <option value="adultos">Adultos (+18)</option>
        </SelectField>

        <SelectField label="Cobrança" id="price_type" name="price_type" value={form.price_type} onChange={handleChange}>
          <option value="gratuita">Gratuita</option>
          <option value="paga">Paga</option>
        </SelectField>

        {form.price_type === 'paga' && (
          <InputField
            label="Valor (R$)"
            id="price_value"
            name="price_value"
            type="number"
            min="0"
            step="0.01"
            value={form.price_value}
            onChange={handleChange}
            placeholder="Ex: 25.00"
          />
        )}

        <SelectField
          label="Nível de Experiência"
          id="experience_level"
          name="experience_level"
          value={form.experience_level}
          onChange={handleChange}
        >
          <option value="todos">Todos os Níveis</option>
          <option value="iniciante">Iniciante</option>
          <option value="intermediario">Intermediário</option>
          <option value="veterano">Veterano</option>
        </SelectField>

        <InputField
          label="Vagas Totais"
          id="slots_total"
          name="slots_total"
          type="number"
          min="1"
          max="20"
          value={form.slots_total}
          onChange={handleChange}
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <input
              type="checkbox"
              id="is_ongoing"
              checked={isOngoing}
              onChange={(e) => {
                setIsOngoing(e.target.checked);
                if (e.target.checked) setForm(prev => ({ ...prev, starts_at: '' }));
              }}
              className="h-4 w-4 rounded border-white/20 bg-white/10 text-[var(--color-artificio-orange)] focus:ring-[var(--color-artificio-orange)]"
            />
            <label htmlFor="is_ongoing" className="text-sm text-white/70 cursor-pointer">
              Mesa já em andamento
            </label>
          </div>
          
          <InputField
            label={isOngoing ? "Mesa em Andamento" : "Data de Início (opcional)"}
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            value={form.starts_at}
            onChange={handleChange}
            disabled={isOngoing}
          />
        </div>

        <SelectField
          label="Frequência das Sessões"
          id="frequency"
          name="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
        >
          <option value="">Não especificada</option>
          <option value="semanal">Semanal</option>
          <option value="quinzenal">Quinzenal</option>
          <option value="mensal">Mensal</option>
          <option value="outros">Outros</option>
        </SelectField>

        {frequency === 'outros' && (
          <InputField
            label="Descreva a frequência *"
            id="frequency_custom"
            name="frequency_custom"
            value={frequencyCustom}
            onChange={(e) => setFrequencyCustom(e.target.value)}
            placeholder="Ex: A cada 15 dias, sempre aos sábados"
            required
          />
        )}

        <InputField
          label="Idioma"
          id="language"
          name="language"
          value={form.language}
          onChange={handleChange}
          placeholder="Português"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium text-white/70">Descrição da Mesa</label>
        <textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          placeholder="Descreva sua campanha, o tom da história, o que esperar..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 transition-all resize-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="rules_notes" className="text-sm font-medium text-white/70">Regras/Observações da Mesa (opcional)</label>
        <textarea
          id="rules_notes"
          name="rules_notes"
          value={rulesNotes}
          onChange={(e) => setRulesNotes(e.target.value)}
          rows={3}
          placeholder="Ex: Usamos regras homebrew para combate, proibido PvP, etc."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 transition-all resize-none"
        />
      </div>

      <InputField
        label="URL do Banner da Mesa (opcional)"
        id="banner_url"
        name="banner_url"
        value={bannerUrl}
        onChange={(e) => { setBannerUrl(e.target.value); setBannerError(false); }}
        placeholder="https://exemplo.com/banner.jpg"
      />

      {/* Preview do banner: mostra placeholder no modo review se não houver URL */}
      {(bannerUrl && !bannerError) ? (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <img
            src={bannerUrl}
            alt="Preview do banner"
            onError={() => setBannerError(true)}
            className="w-full max-h-48 object-cover"
          />
        </div>
      ) : mode === 'review' && (
        <div className="overflow-hidden rounded-xl border border-white/10 opacity-50">
          <img
            src={bannerPlaceholder}
            alt="Placeholder — sem banner definido"
            className="w-full max-h-48 object-cover"
          />
          <p className="text-center text-xs text-white/40 py-1 bg-black/40">Sem banner — placeholder padrão será exibido</p>
        </div>
      )}

      {mode === 'review' && gmAvatarUrl && !avatarError && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <img
            src={gmAvatarUrl}
            alt="Avatar do mestre (Discord)"
            onError={() => setAvatarError(true)}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/20 flex-shrink-0"
          />
          <div>
            <p className="text-xs font-semibold text-white/80">Avatar do mestre (importado do Discord)</p>
            <p className="text-xs text-white/40">Não é salvo no banco. Apenas referência visual.</p>
          </div>
        </div>
      )}

      <ContactsFormBlock
        contacts={contacts}
        onChange={(next) => {
          setContacts(next);
          if (contactsError) setContactsError(null);
        }}
        error={contactsError}
      />

      {isDdalEligibleSelection && (
        <section className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-5 space-y-4" id="painel-mestre-ddal-block">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-100 inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Caminho elegível para selo DDAL
              </p>
              <p className="text-xs text-amber-100/80 mt-1">Ative apenas para módulos Adventurers League.</p>
            </div>

            <label htmlFor="painel-mestre-ddal-toggle" className="inline-flex items-center gap-2 text-sm text-amber-100">
              <input
                id="painel-mestre-ddal-toggle"
                type="checkbox"
                checked={ddal.is_ddal}
                onChange={(e) => setDdal((prev) => ({ ...prev, is_ddal: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-white/10"
              />
              É DDAL
            </label>
          </div>

          {ddal.is_ddal && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Código da Aventura *"
                id="ddal_code"
                name="ddal_code"
                value={ddal.ddal_code}
                onChange={handleDdalChange}
                placeholder="Ex: DDAL05-01"
                required
              />

              <InputField
                label="Nome da Aventura *"
                id="ddal_name"
                name="ddal_name"
                value={ddal.ddal_name}
                onChange={handleDdalChange}
                placeholder="Ex: Treasure of the Broken Hoard"
                required
              />

              <SelectField
                label="Tier *"
                id="ddal_tier"
                name="ddal_tier"
                value={ddal.ddal_tier}
                onChange={handleDdalChange}
                required
              >
                <option value="">Selecione</option>
                <option value="1">Tier 1</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
                <option value="4">Tier 4</option>
              </SelectField>

              <InputField
                label="Season"
                id="ddal_season"
                name="ddal_season"
                value={ddal.ddal_season}
                onChange={handleDdalChange}
                placeholder="Ex: Season 10"
              />

              <InputField
                label="Duração esperada"
                id="ddal_duration"
                name="ddal_duration"
                value={ddal.ddal_duration}
                onChange={handleDdalChange}
                placeholder="Ex: 4h"
              />

              <InputField
                label="Formato"
                id="ddal_format"
                name="ddal_format"
                value={ddal.ddal_format}
                onChange={handleDdalChange}
                placeholder="Ex: modulo, hardcover ou ccc"
              />

              <InputField
                label="Código expandido / organização"
                id="ddal_org_code"
                name="ddal_org_code"
                value={ddal.ddal_org_code}
                onChange={handleDdalChange}
                placeholder="Ex: CCC-BMG-01"
              />

              <InputField
                label="Ambientação"
                id="ddal_setting"
                name="ddal_setting"
                value={ddal.ddal_setting}
                onChange={handleDdalChange}
                placeholder="Ex: Forgotten Realms"
              />

              <div className="md:col-span-2 flex flex-col gap-1">
                <label htmlFor="ddal_rules_notes" className="text-sm font-medium text-white/70">Notas de regras da temporada</label>
                <textarea
                  id="ddal_rules_notes"
                  name="ddal_rules_notes"
                  value={ddal.ddal_rules_notes}
                  onChange={handleDdalChange}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 transition-all resize-none"
                  placeholder="Observações úteis para jogadores e organização"
                />
              </div>
            </div>
          )}
        </section>
      )}

      {mode === 'review' && (
        <section className="rounded-2xl border border-orange-500/30 bg-orange-900/10 p-5 space-y-3" id="painel-mestre-covil-block">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-orange-200 flex items-center gap-2">
                🏰 Mesa do Covil do Lich
              </p>
              <p className="text-xs text-orange-100/70 mt-1">Detectado automaticamente pelo parser. Pode ser editado antes de publicar.</p>
            </div>
            <label htmlFor="covil-toggle" className="inline-flex items-center gap-2 text-sm text-orange-100 cursor-pointer">
              <input
                id="covil-toggle"
                type="checkbox"
                checked={isCovilMesa}
                onChange={(e) => setIsCovilMesa(e.target.checked)}
                className="h-4 w-4 rounded border-orange-300/30 bg-orange-900/20 text-orange-400"
              />
              É Covil do Lich
            </label>
          </div>
        </section>
      )}

      {error && (
        <div className="p-4 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        id="btn-criar-mesa"
        className="w-full py-4 bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors cursor-pointer"
      >
        {loading 
          ? (mode === 'review' ? 'Aprovando...' : 'Publicando...') 
          : (mode === 'review' ? 'Aprovar e Publicar' : 'Publicar Mesa')
        }
      </button>

      <SystemSuggestionModal
        isOpen={showSuggestionModal}
        onClose={() => setShowSuggestionModal(false)}
        onSuccess={() => {
          setShowSuggestionModal(false);
          // Recarregar árvore de sistemas
          fetchSystemsTree();
        }}
      />
    </form>
  );
}

function CreateGmProfileForm({ token, onSuccess }: { token: string; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugifyFromNickname(nickname));
    }
  }, [nickname, slugEdited]);

  const suggestedSlug = slugifyFromNickname(nickname);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/gm/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug, nickname, bio_long: bio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido');
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
      <p className="text-white/60 text-sm leading-relaxed">
        Para publicar mesas, você precisa criar seu perfil de Mestre. Escolha um identificador único — ele vai aparecer na URL do seu perfil.
      </p>
      <InputField
        label="Nick público *"
        id="gm-nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Ex: Mestre Corvo"
        minLength={2}
        maxLength={40}
        required
      />

      <InputField
        label="Identificador (slug) *"
        id="gm-slug"
        value={slug}
        onChange={(e) => {
          setSlugEdited(true);
          setSlug(slugifyFromNickname(e.target.value));
        }}
        placeholder="ex: mestre-corvo"
        required
      />
      <p className="text-xs text-white/30 -mt-2">Apenas letras minúsculas, números e hífens. Não pode ser alterado depois.</p>
      {slugEdited && suggestedSlug && suggestedSlug !== slug && (
        <button
          type="button"
          id="btn-gm-slug-usar-sugestao"
          onClick={() => {
            setSlug(suggestedSlug);
            setSlugEdited(false);
          }}
          className="text-left text-xs text-[var(--color-artificio-orange)] hover:text-[var(--color-artificio-orange-hover)] transition-colors"
        >
          Usar sugestão automática: {suggestedSlug}
        </button>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="gm-bio" className="text-sm font-medium text-white/70">Bio (opcional)</label>
        <textarea
          id="gm-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Conte um pouco sobre você como mestre..."
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[var(--color-artificio-orange)]/60 transition-all resize-none"
        />
      </div>
      {error && <div className="p-3 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        id="btn-criar-perfil-gm"
        className="w-full py-4 bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] disabled:opacity-50 text-white font-bold rounded-xl transition-colors cursor-pointer"
      >
        {loading ? 'Criando perfil...' : 'Criar Perfil de Mestre'}
      </button>
    </form>
  );
}

export const PainelMestrePage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [gmProfile, setGmProfile] = useState<GmProfile | null>(null);
  const [myTables, setMyTables] = useState<MyTable[]>([]);
  const [view, setView] = useState<'dashboard' | 'create-table' | 'create-profile'>('dashboard');
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user || !token) {
      navigate('/');
      return;
    }

    const loadPanelData = async () => {
      setLoadingProfile(true);

      try {
        const profileRes = await fetch('/api/v1/gm/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileRes.ok) {
          if (user.role !== 'gm') {
            setView('create-profile');
          }
          setGmProfile(null);
          setMyTables([]);
          return;
        }

        const profileJson = await profileRes.json();
        const profile = profileJson?.data ?? null;

        if (!profile) {
          if (user.role !== 'gm') {
            setView('create-profile');
          }
          setGmProfile(null);
          setMyTables([]);
          return;
        }

        setGmProfile(profile);

        const tablesRes = await fetch('/api/v1/gm/tables', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (tablesRes.ok) {
          const tablesJson = await tablesRes.json();
          setMyTables(tablesJson?.data ?? []);
        } else {
          setMyTables([]);
        }

        setView('dashboard');
      } catch {
        setGmProfile(null);
        setMyTables([]);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadPanelData();
  }, [navigate, token, user]);

  const refreshData = () => {
    setView('dashboard');
    setLoadingProfile(true);

    Promise.all([
      fetch('/api/v1/gm/me', { headers: { Authorization: `Bearer ${token!}` } }),
      fetch('/api/v1/gm/tables', { headers: { Authorization: `Bearer ${token!}` } }),
    ])
      .then(async ([profileRes, tablesRes]) => {
        if (profileRes.ok) {
          const profileJson = await profileRes.json();
          setGmProfile(profileJson?.data ?? null);
        }

        if (tablesRes.ok) {
          const tablesJson = await tablesRes.json();
          setMyTables(tablesJson?.data ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));
  };

  const activeTablesCount = useMemo(
    () => myTables.filter((table) => table.status === 'active').length,
    [myTables]
  );

  const openSlotsCount = useMemo(
    () => myTables.reduce((acc, table) => acc + Math.max(table.slots_total - table.slots_filled, 0), 0),
    [myTables]
  );

  if (!user) return null;

  return (
    <main className="w-full">
      <div className="container mx-auto px-6 py-10">
        {loadingProfile ? (
          <div className="flex justify-center py-20 animate-pulse text-white/40">Carregando painel...</div>
        ) : view === 'create-profile' ? (
          <div className="max-w-lg mx-auto text-center space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold mb-3">Torne-se um Mestre</h1>
              <p className="text-white/50">Crie seu perfil público e comece a publicar mesas gratuitamente.</p>
            </div>
            <CreateGmProfileForm token={token!} onSuccess={refreshData} />
          </div>
        ) : view === 'create-table' ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('dashboard')} className="text-white/40 hover:text-white transition-colors cursor-pointer text-sm">← Voltar</button>
              <ChevronRight className="w-4 h-4 text-white/20" />
              <h1 className="text-2xl font-bold">Nova Mesa</h1>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-8">
              <CreateTableForm token={token!} onSuccess={refreshData} />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-3xl font-extrabold">
                  {gmProfile ? `Olá, ${gmProfile.nickname ?? `@${gmProfile.slug}`}` : 'Painel do Mestre'}
                </h1>
                {gmProfile && (
                  <p className="text-white/40 mt-1 text-sm">
                    {gmProfile.tables_count} mesa{gmProfile.tables_count !== 1 ? 's' : ''} publicada{gmProfile.tables_count !== 1 ? 's' : ''}
                    {gmProfile.avg_rating ? ` · ★ ${gmProfile.avg_rating.toFixed(1)}` : ''}
                  </p>
                )}
              </div>
              <button
                id="btn-nova-mesa"
                onClick={() => setView('create-table')}
                className="flex items-center gap-2 px-5 py-3 bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] text-white font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                Nova Mesa
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Mesas Ativas', value: activeTablesCount, icon: <Globe className="w-5 h-5" /> },
                { label: 'Vagas Abertas', value: openSlotsCount, icon: <Users className="w-5 h-5" /> },
                { label: 'Total de Mesas', value: gmProfile?.tables_count ?? 0, icon: <Dice1 className="w-5 h-5" /> },
              ].map((card) => (
                <div key={card.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-artificio-orange)]/10 text-[var(--color-artificio-orange)] flex items-center justify-center">
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-white/40 text-sm">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {myTables.length > 0 ? (
              <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
                <h2 className="text-lg font-bold inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-artificio-orange)]" />
                  Suas mesas publicadas
                </h2>

                <div className="space-y-3">
                  {myTables.map((table) => {
                    const openSlots = Math.max(table.slots_total - table.slots_filled, 0);

                    return (
                      <article
                        key={table.id}
                        className="rounded-xl border border-white/10 bg-[#13213f]/60 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <p className="font-semibold text-white">{table.title}</p>
                          <p className="text-xs text-white/60">{table.system_name ?? 'Sistema livre'} · {table.modality}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="px-2 py-1 rounded-md border border-white/15 bg-white/5 text-white/75">
                              {table.slots_filled}/{table.slots_total} ({openSlots} vagas)
                            </span>
                            {table.publisher_role === 'announcer' && (
                              <span className="px-2 py-1 rounded-md border border-slate-300/30 bg-slate-500/15 text-slate-100" id={`painel-mesa-announcer-${table.slug}`}>
                                Apenas anunciante{table.actual_gm_name ? ` · Mestre: ${table.actual_gm_name}` : ''}
                              </span>
                            )}
                            <span className="px-2 py-1 rounded-md border border-white/15 bg-white/5 text-white/70">
                              {table.contacts?.length ?? 0} contato{(table.contacts?.length ?? 0) !== 1 ? 's' : ''}
                            </span>
                            {table.is_ddal && (
                              <span className="px-2 py-1 rounded-md border border-amber-400/40 bg-amber-500/15 text-amber-100" id={`painel-mesa-ddal-${table.slug}`}>
                                DDAL{table.ddal_code ? ` · ${table.ddal_code}` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-md text-xs border border-white/15 bg-white/5 text-white/70 uppercase">
                            {table.status}
                          </span>
                          <Link
                            to={`/mesas/${table.slug}`}
                            className="px-3 py-2 rounded-lg text-xs border border-white/20 hover:border-[var(--color-artificio-orange)] hover:text-[var(--color-artificio-orange)] transition-colors"
                            id={`painel-mesa-link-${table.slug}`}
                          >
                            Abrir página
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : (
              <div className="text-center py-20 text-white/30 border border-dashed border-white/10 rounded-2xl">
                <MapPin className="w-10 h-10 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhuma mesa ainda.</p>
                <p className="text-sm mt-2">Clique em "Nova Mesa" para começar.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};
