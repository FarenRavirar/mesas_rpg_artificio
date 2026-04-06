import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, InputHTMLAttributes } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle, ChevronRight, Dice1, Globe, MapPin, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { type ContactFormEntry } from '../components/ContactsFormBlock';
import { type SessionSchedule } from '../components/SessionRepeater';
import toast from 'react-hot-toast';
import type { SystemTreeNode } from '../types/systems';
import type { TableContact } from '../types/tables';
// Step form components
import { StepHeader } from '../components/form-steps/StepHeader';
import { StepActions } from '../components/form-steps/StepActions';
import { StepBasic } from '../components/form-steps/steps/StepBasic';
import { StepSystem } from '../components/form-steps/steps/StepSystem';
import { StepConfig } from '../components/form-steps/steps/StepConfig';
import { StepSessions } from '../components/form-steps/steps/StepSessions';
import { StepFinal } from '../components/form-steps/steps/StepFinal';
import { StepReview } from '../components/form-steps/steps/StepReview';

type TableStatus = 'draft' | 'active' | 'full' | 'cancelled' | 'ended' | 'pending_review';

const DDAL_ELIGIBLE_PATH = 'dungeons-dragons/5e/2024';

type FormStep = 1 | 2 | 3 | 4 | 5 | 6;

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
    sessions?: SessionSchedule[]; // Sessões importadas do parser
    // CORREÇÃO: Adicionar campos avançados (REQ-26)
    master_display_name?: string;
    campaign_length?: string;
    level_range?: string;
    billing_text?: string;
    session_zero_free?: boolean;
    synopsis?: string;
    style_text?: string;
    listing_excerpt?: string;
    technical_requirements?: string;
    requires_pc?: boolean;
    requires_camera?: boolean;
    requires_microphone?: boolean;
    // Campos de cenário e estilos (REQ-28)
    setting_name?: string;
    setting_styles?: string[];
    // CORREÇÃO B03: Campos editoriais (REQ-28 Fase 6)
    synopsis_narrative?: string;
    benefits_text?: string;
    gm_bio?: string;
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



export function CreateTableForm({ token, onSuccess, initialData, mode = 'create', candidateId }: CreateTableFormProps) {
  // Estado de step (1-6)
  const [step, setStep] = useState<FormStep>(1);
  const [maxStepUnlocked, setMaxStepUnlocked] = useState<FormStep>(1);

  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [savedDraft, setSavedDraft] = useState<Record<string, unknown> | null>(null);

  const [systemsTree, setSystemsTree] = useState<SystemTreeNode[]>([]);
  const [systemsLoading, setSystemsLoading] = useState(true);
  const [systemsError, setSystemsError] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<string>('');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(initialData?.scenario_id || null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'campanha',
    audience: 'livre',
    modality: initialData?.modality || (mode === 'create' ? 'online' : ''),
    price_type: initialData?.price_type || 'gratuita',
    price_value: '',
    slots_total: initialData?.slots_total || (mode === 'create' ? '4' : ''),
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
  ])
  const [contactsError, setContactsError] = useState<string | null>(null);

  // Estado de sessões (substitui frequency, isOngoing, starts_at)
  const [sessions, setSessions] = useState<SessionSchedule[]>(
    initialData?.sessions && initialData.sessions.length > 0
      ? initialData.sessions
      : mode === 'create'
        ? [
          {
            day_of_week: 'segunda',
            start_time: '19:00',
            end_time: '22:00',
            frequency: 'semanal',
            slots_per_session: null,
            is_ongoing: false,
            notes: '',
            sort_order: 0,
          },
        ]
        : [] // Modo review sem sessions importadas = array vazio
  );

  const [rulesNotes, setRulesNotes] = useState(initialData?.rules_notes || '');
  const [bannerUrl, setBannerUrl] = useState(initialData?.banner_url || '');
  const [gmAvatarUrl] = useState(initialData?.gm_avatar_url || ''); // readonly, apenas visual
  const [isCovilMesa, setIsCovilMesa] = useState(initialData?.is_covil ?? false);
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Estados para campos avançados (REQ-26)
  const [masterDisplayName, setMasterDisplayName] = useState(initialData?.master_display_name || '');
  const [campaignLength, setCampaignLength] = useState(initialData?.campaign_length || '');
  const [levelRange, setLevelRange] = useState(initialData?.level_range || '');
  const [billingText, setBillingText] = useState(initialData?.billing_text || '');
  const [sessionZeroFree, setSessionZeroFree] = useState(initialData?.session_zero_free || false);
  const [synopsis, setSynopsis] = useState(initialData?.synopsis || '');
  const [styleText, setStyleText] = useState(initialData?.style_text || '');
  const [listingExcerpt, setListingExcerpt] = useState(initialData?.listing_excerpt || '');
  const [technicalRequirements, setTechnicalRequirements] = useState(initialData?.technical_requirements || '');
  const [requiresPc, setRequiresPc] = useState(initialData?.requires_pc || false);
  const [requiresCamera, setRequiresCamera] = useState(initialData?.requires_camera || false);
  const [requiresMicrophone, setRequiresMicrophone] = useState(initialData?.requires_microphone || false);
  // Estados para cenário e estilos (REQ-28)
  const [settingName, setSettingName] = useState(initialData?.setting_name || '');
  const [settingStyles, setSettingStyles] = useState<string[]>(initialData?.setting_styles || []);
  // CORREÇÃO B03: Estados para campos editoriais (REQ-28 Fase 6)
  const [synopsisNarrative, _setSynopsisNarrative] = useState(initialData?.synopsis_narrative || '');
  const [benefitsText, _setBenefitsText] = useState(initialData?.benefits_text || '');
  const [gmBio, _setGmBio] = useState(initialData?.gm_bio || '');

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

  // Validação por step (nova ordem: 1=Básico, 2=Sistema, 3=Sessões, 4=Config, 5=Final, 6=Revisão)
  const canProceed = (currentStep: number): boolean => {
    if (currentStep === 1) {
      return form.title.trim().length > 3;
    }
    if (currentStep === 2) {
      return !!selectedSystemId;
    }
    if (currentStep === 3) {
      return sessions.length > 0;
    }
    if (currentStep === 4) {
      if (form.slots_total === '' || parseInt(form.slots_total) < 1) return false;
      if (publisherRole === 'announcer' && actualGmName.trim().length < 2) return false;
      return true;
    }
    if (currentStep === 5) {
      const validContacts = contacts.filter((c) => c.value.trim().length > 0);
      return validContacts.length > 0;
    }
    return true;
  };

  const getStepError = (currentStep: number): string | undefined => {
    if (currentStep === 1 && form.title.trim().length <= 3) {
      return 'O título deve ter pelo menos 4 caracteres';
    }
    if (currentStep === 2 && !selectedSystemId) {
      return 'Selecione um sistema na árvore';
    }
    if (currentStep === 3 && sessions.length === 0) {
      return 'Configure pelo menos uma sessão';
    }
    if (currentStep === 4) {
      if (form.slots_total === '' || parseInt(form.slots_total) < 1) {
        return 'Informe o número de vagas (mínimo 1)';
      }
      if (publisherRole === 'announcer' && actualGmName.trim().length < 2) {
        return 'Informe o nome do mestre real';
      }
    }
    if (currentStep === 5) {
      const validContacts = contacts.filter((c) => c.value.trim().length > 0);
      if (validContacts.length === 0) {
        return 'Informe pelo menos um canal de contato válido';
      }
    }
    return undefined;
  };

  // Autosave com feedback visual (debounce 1s)
  useEffect(() => {
    if (mode !== 'create') return;

    setDraftStatus('saving');
    const timeout = setTimeout(() => {
      const draft = {
        form,
        sessions,
        contacts,
        selectedSystemId,
        selectedScenarioId,
        publisherRole,
        actualGmName,
        rulesNotes,
        bannerUrl,
        isCovilMesa,
        ddal,
        masterDisplayName,
        campaignLength,
        levelRange,
        billingText,
        sessionZeroFree,
        synopsis,
        styleText,
        listingExcerpt,
        technicalRequirements,
        requiresPc,
        requiresCamera,
        requiresMicrophone,
        settingName,
        settingStyles,
      };
      localStorage.setItem('create-table-draft', JSON.stringify(draft));
      setDraftStatus('saved');
      setTimeout(() => setDraftStatus('idle'), 2000);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [
    form,
    sessions,
    contacts,
    selectedSystemId,
    selectedScenarioId,
    publisherRole,
    actualGmName,
    rulesNotes,
    bannerUrl,
    isCovilMesa,
    ddal,
    masterDisplayName,
    campaignLength,
    levelRange,
    billingText,
    sessionZeroFree,
    synopsis,
    styleText,
    listingExcerpt,
    technicalRequirements,
    requiresPc,
    requiresCamera,
    requiresMicrophone,
    settingName,
    settingStyles,
    mode,
  ]);

  // Restore com modal de confirmação (apenas no modo create)
  useEffect(() => {
    if (mode !== 'create') return;

    const saved = localStorage.getItem('create-table-draft');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setSavedDraft(parsed);
      setShowRestoreModal(true);
    } catch (err) {
      console.error('[CreateTableForm] Erro ao carregar draft:', err);
    }
  }, [mode]);

  const handleRestoreDraft = () => {
    if (!savedDraft) return;

    if (savedDraft.form) setForm(savedDraft.form as typeof form);
    if (savedDraft.sessions) setSessions(savedDraft.sessions as SessionSchedule[]);
    if (savedDraft.contacts) setContacts(savedDraft.contacts as ContactFormEntry[]);
    if (savedDraft.selectedSystemId) setSelectedSystemId(savedDraft.selectedSystemId as string);
    if (savedDraft.selectedScenarioId) setSelectedScenarioId(savedDraft.selectedScenarioId as string | null);
    if (savedDraft.publisherRole) setPublisherRole(savedDraft.publisherRole as 'gm' | 'announcer');
    if (savedDraft.actualGmName) setActualGmName(savedDraft.actualGmName as string);
    if (savedDraft.rulesNotes) setRulesNotes(savedDraft.rulesNotes as string);
    if (savedDraft.bannerUrl) setBannerUrl(savedDraft.bannerUrl as string);
    if (savedDraft.isCovilMesa !== undefined) setIsCovilMesa(savedDraft.isCovilMesa as boolean);
    if (savedDraft.ddal) setDdal(savedDraft.ddal as DdalFormState);
    if (savedDraft.masterDisplayName) setMasterDisplayName(savedDraft.masterDisplayName as string);
    if (savedDraft.campaignLength) setCampaignLength(savedDraft.campaignLength as string);
    if (savedDraft.levelRange) setLevelRange(savedDraft.levelRange as string);
    if (savedDraft.billingText) setBillingText(savedDraft.billingText as string);
    if (savedDraft.sessionZeroFree !== undefined) setSessionZeroFree(savedDraft.sessionZeroFree as boolean);
    if (savedDraft.synopsis) setSynopsis(savedDraft.synopsis as string);
    if (savedDraft.styleText) setStyleText(savedDraft.styleText as string);
    if (savedDraft.listingExcerpt) setListingExcerpt(savedDraft.listingExcerpt as string);
    if (savedDraft.technicalRequirements) setTechnicalRequirements(savedDraft.technicalRequirements as string);
    if (savedDraft.requiresPc !== undefined) setRequiresPc(savedDraft.requiresPc as boolean);
    if (savedDraft.requiresCamera !== undefined) setRequiresCamera(savedDraft.requiresCamera as boolean);
    if (savedDraft.requiresMicrophone !== undefined) setRequiresMicrophone(savedDraft.requiresMicrophone as boolean);
    if (savedDraft.settingName) setSettingName(savedDraft.settingName as string);
    if (savedDraft.settingStyles) setSettingStyles(savedDraft.settingStyles as string[]);

    setShowRestoreModal(false);
    toast.success('Rascunho restaurado');
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem('create-table-draft');
    setSavedDraft(null);
    setShowRestoreModal(false);
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
        starts_at: null, // Removido - agora usa schedules
        publisher_role: publisherRole,
        actual_gm_name: publisherRole === 'announcer' ? safeActualGmName : null,
        contacts: sanitizedContacts,
        schedules: sessions, // Novo campo - array de horários
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
        // Campos avançados (REQ-26)
        master_display_name: masterDisplayName.trim() || null,
        campaign_length: campaignLength.trim() || null,
        level_range: levelRange.trim() || null,
        billing_text: billingText.trim() || null,
        session_zero_free: sessionZeroFree,
        synopsis: synopsis.trim() || null,
        style_text: styleText.trim() || null,
        listing_excerpt: listingExcerpt.trim() || null,
        technical_requirements: technicalRequirements.trim() || null,
        requires_pc: requiresPc,
        requires_camera: requiresCamera,
        requires_microphone: requiresMicrophone,
        // Campos de cenário e estilos (REQ-28)
        setting_name: settingName.trim() || null,
        setting_styles: settingStyles.length > 0 ? settingStyles : null,
        // CORREÇÃO B03: Campos editoriais (REQ-28 Fase 6)
        synopsis_narrative: synopsisNarrative.trim() || null,
        benefits_text: benefitsText.trim() || null,
        gm_bio: gmBio.trim() || null,
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

  // Nome do sistema selecionado (para StepReview)
  const selectedSystemName = useMemo(() => {
    return flattenedSystems.find((s) => s.id === selectedSystemId)?.name || null;
  }, [flattenedSystems, selectedSystemId]);

  // Nome do cenário selecionado (para StepReview)
  const [selectedScenarioName, setSelectedScenarioName] = useState<string | null>(null);

  // Buscar nome do cenário quando selectedScenarioId mudar
  useEffect(() => {
    if (!selectedScenarioId) {
      setSelectedScenarioName(null);
      return;
    }

    const fetchScenarioName = async () => {
      try {
        const res = await fetch(`/api/v1/scenarios/${selectedScenarioId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedScenarioName(data.data?.name || null);
        }
      } catch (err) {
        console.error('[CreateTableForm] Erro ao buscar nome do cenário:', err);
      }
    };

    fetchScenarioName();
  }, [selectedScenarioId]);

  // Limpar draft ao publicar com sucesso
  const handleSubmitWithCleanup = async (e: FormEvent) => {
    e.preventDefault();
    await handleSubmit(e);
    // Limpar draft após sucesso
    localStorage.removeItem('create-table-draft');
  };

  // Handler de navegação entre steps
  const handleNavigate = (targetStep: number) => {
    const target = targetStep as FormStep;
    if (target <= maxStepUnlocked) {
      setStep(target);
    }
  };

  // Atualizar maxStepUnlocked ao avançar
  const handleNext = () => {
    if (canProceed(step)) {
      const nextStep = (step + 1) as FormStep;
      setStep(nextStep);
      setMaxStepUnlocked((prev) => Math.max(prev, nextStep) as FormStep);
    }
  };

  return (
    <>
      {/* Modal de restore de rascunho */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0B1628] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold text-white">Rascunho encontrado</h3>
            <p className="text-white/70 text-sm">
              Encontramos um rascunho salvo. Deseja continuar de onde parou?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRestoreDraft}
                autoFocus
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-artificio-orange)] hover:bg-[var(--color-artificio-orange-hover)] text-white font-semibold transition-colors"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="flex-1 px-4 py-3 rounded-xl border border-white/20 hover:border-white/40 text-white/70 hover:text-white transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitWithCleanup} className="space-y-6">
        {/* Feedback de autosave */}
        {draftStatus !== 'idle' && mode === 'create' && (
          <div className="flex items-center gap-2 text-xs text-white/50">
            {draftStatus === 'saving' && (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white/70 rounded-full animate-spin" />
                <span>Salvando rascunho...</span>
              </>
            )}
            {draftStatus === 'saved' && (
              <>
                <span className="text-green-400">✔</span>
                <span className="text-green-400/70">Rascunho salvo</span>
              </>
            )}
          </div>
        )}

        <StepHeader step={step} maxStepUnlocked={maxStepUnlocked} onNavigate={handleNavigate} />

      {step === 1 && (
        <StepBasic
          form={form}
          setForm={setForm}
        />
      )}

      {step === 2 && (
        <StepSystem
          systemsTree={systemsTree}
          systemsLoading={systemsLoading}
          systemsError={systemsError}
          selectedSystemId={selectedSystemId}
          setSelectedSystemId={setSelectedSystemId}
          selectedScenarioId={selectedScenarioId}
          setSelectedScenarioId={setSelectedScenarioId}
          onRefreshSystems={fetchSystemsTree}
        />
      )}

      {step === 3 && (
        <StepSessions
          sessions={sessions}
          setSessions={setSessions}
        />
      )}

      {step === 4 && (
        <StepConfig
          form={form}
          setForm={setForm}
          publisherRole={publisherRole}
          setPublisherRole={setPublisherRole}
          actualGmName={actualGmName}
          setActualGmName={setActualGmName}
        />
      )}

      {step === 5 && (
        <StepFinal
          contacts={contacts}
          setContacts={setContacts}
          contactsError={contactsError}
          setContactsError={setContactsError}
          rulesNotes={rulesNotes}
          setRulesNotes={setRulesNotes}
          bannerUrl={bannerUrl}
          setBannerUrl={setBannerUrl}
          bannerError={bannerError}
          setBannerError={setBannerError}
          gmAvatarUrl={gmAvatarUrl}
          avatarError={avatarError}
          setAvatarError={setAvatarError}
          isCovilMesa={isCovilMesa}
          setIsCovilMesa={setIsCovilMesa}
          mode={mode}
          isDdalEligibleSelection={isDdalEligibleSelection}
          ddal={ddal}
          setDdal={setDdal}
          masterDisplayName={masterDisplayName}
          setMasterDisplayName={setMasterDisplayName}
          campaignLength={campaignLength}
          setCampaignLength={setCampaignLength}
          levelRange={levelRange}
          setLevelRange={setLevelRange}
          billingText={billingText}
          setBillingText={setBillingText}
          sessionZeroFree={sessionZeroFree}
          setSessionZeroFree={setSessionZeroFree}
          synopsis={synopsis}
          setSynopsis={setSynopsis}
          styleText={styleText}
          setStyleText={setStyleText}
          listingExcerpt={listingExcerpt}
          setListingExcerpt={setListingExcerpt}
          technicalRequirements={technicalRequirements}
          setTechnicalRequirements={setTechnicalRequirements}
          requiresPc={requiresPc}
          setRequiresPc={setRequiresPc}
          requiresCamera={requiresCamera}
          setRequiresCamera={setRequiresCamera}
          requiresMicrophone={requiresMicrophone}
          setRequiresMicrophone={setRequiresMicrophone}
          settingName={settingName}
          setSettingName={setSettingName}
          settingStyles={settingStyles}
          setSettingStyles={setSettingStyles}
          priceType={form.price_type}
        />
      )}

      {step === 6 && (
        <StepReview
          form={form}
          selectedSystemName={selectedSystemName}
          selectedScenarioName={selectedScenarioName}
          sessions={sessions}
          contacts={contacts}
          publisherRole={publisherRole}
          actualGmName={actualGmName}
          rulesNotes={rulesNotes}
          bannerUrl={bannerUrl}
        />
      )}

      {error && (
        <div className="p-4 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      <StepActions
        step={step}
        setStep={(n) => {
          if (n < step) {
            // Voltar: permitido sempre
            setStep(n as FormStep);
          } else {
            // Avançar: usar handleNext
            handleNext();
          }
        }}
        canNext={canProceed(step)}
        errorMessage={getStepError(step)}
        onSubmit={() => handleSubmitWithCleanup({ preventDefault: () => {} } as FormEvent)}
        loading={loading}
      />

    </form>
    </>
  );
}


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
  // CORREÇÃO DT-06: State para modo de edição
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingTableData, setEditingTableData] = useState<any>(null);

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

  // CORREÇÃO DT-06: Detectar query param ?edit= e carregar dados da mesa
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const editId = searchParams.get('edit');

    if (editId && token) {
      setEditingTableId(editId);

      // Carregar dados da mesa
      const loadTableData = async () => {
        try {
          const response = await fetch(`/api/v1/tables/${editId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const data = await response.json();
            setEditingTableData(data.data);
            setView('create-table');
          } else {
            toast.error('Mesa não encontrada');
            setEditingTableId(null);
          }
        } catch (error) {
          console.error('[PainelMestrePage] Erro ao carregar mesa para edição:', error);
          toast.error('Erro ao carregar mesa');
          setEditingTableId(null);
        }
      };

      loadTableData();
    }
  }, [token]);

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
      .catch(() => { })
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

  const handleToggleTableStatus = async (tableId: string, currentStatus: string, title: string) => {
    if (!token) return;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'ativar' : 'desativar';

    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} mesa "${title}"?`)) return;

    try {
      // CORREÇÃO DT-04: Admin usa rota admin
      const endpoint = user?.role === 'admin'
        ? `/api/v1/gm/admin/tables/${tableId}`
        : `/api/v1/gm/tables/${tableId}`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Mesa ${action === 'ativar' ? 'ativada' : 'desativada'}!`);
        refreshData();
      } else {
        const data = await response.json();
        toast.error(data.error || `Erro ao ${action} mesa`);
      }
    } catch (error) {
      console.error('[PainelMestrePage] Erro ao alterar status da mesa:', error);
      toast.error(`Erro ao ${action} mesa`);
    }
  };

  const handleDeleteTable = async (tableId: string, title: string) => {
    if (!token) return;
    if (!confirm(`Deletar mesa "${title}"? Esta ação não pode ser desfeita.`)) return;

    try {
      // CORREÇÃO DT-04b: Admin usa rota admin
      const endpoint = user?.role === 'admin'
        ? `/api/v1/gm/admin/tables/${tableId}`
        : `/api/v1/gm/tables/${tableId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Mesa deletada!');
        refreshData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao deletar mesa');
      }
    } catch (error) {
      console.error('[PainelMestrePage] Erro ao deletar mesa:', error);
      toast.error('Erro ao deletar mesa');
    }
  };

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
              <h1 className="text-2xl font-bold">{editingTableId ? 'Editar Mesa' : 'Nova Mesa'}</h1>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-8">
              <CreateTableForm
                token={token!}
                onSuccess={refreshData}
                initialData={editingTableData || undefined}
              />
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
                          <Link
                            to={`/painel-mestre?edit=${table.id}`}
                            className="px-3 py-2 rounded-lg text-xs bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleToggleTableStatus(table.id, table.status, table.title)}
                            className={`px-3 py-2 rounded-lg text-xs ${table.status === 'active' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white transition-colors`}
                          >
                            {table.status === 'active' ? 'Desativar' : 'Ativar'}
                          </button>
                          <button
                            onClick={() => handleDeleteTable(table.id, table.title)}
                            className="px-3 py-2 rounded-lg text-xs bg-red-500 hover:bg-red-600 text-white transition-colors"
                          >
                            Deletar
                          </button>
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
