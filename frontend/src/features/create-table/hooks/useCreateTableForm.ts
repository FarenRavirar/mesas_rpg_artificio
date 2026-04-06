import { useState, useEffect } from 'react';
import type { FormState, DdalFormState } from '../types/createTable.types';
import type { SessionSchedule } from '../../../components/SessionRepeater';
import type { ContactFormEntry } from '../../../components/ContactsFormBlock';
import { formStateToPayload } from '../utils/mapper';

interface UseCreateTableFormOptions {
  initialData?: Partial<FormState>;
  token: string;
  onSuccess: () => void;
  mode?: 'create' | 'review';
  candidateId?: string;
}

/**
 * Hook centralizado para gerenciar todo o estado do formulário
 */
export function useCreateTableForm(options: UseCreateTableFormOptions) {
  const { initialData, token, onSuccess, mode = 'create', candidateId } = options;

  // Estado do formulário básico
  const [form, setForm] = useState({
    title: initialData?.form?.title || '',
    description: initialData?.form?.description || '',
    type: initialData?.form?.type || 'campaign',
    modality: initialData?.form?.modality || 'online',
    audience: initialData?.form?.audience || 'livre',
    price_type: initialData?.form?.price_type || 'free',
    price_value: initialData?.form?.price_value || '',
    slots_total: initialData?.form?.slots_total || '4',
    experience_level: initialData?.form?.experience_level || 'todos',
    language: initialData?.form?.language || 'pt-BR',
  });

  // Sistema e cenário
  const [selectedSystemId, setSelectedSystemId] = useState(initialData?.selectedSystemId || '');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(
    initialData?.selectedScenarioId || null
  );

  // Sessões
  const [sessions, setSessions] = useState<SessionSchedule[]>(
    initialData?.sessions || (mode === 'create' ? [{
      day_of_week: 'segunda',
      start_time: '19:00',
      end_time: '22:00',
      frequency: 'semanal',
      slots_per_session: null,
      is_ongoing: false,
      notes: '',
      sort_order: 0,
    }] : [])
  );

  // Configuração
  const [publisherRole, setPublisherRole] = useState<'gm' | 'announcer'>(
    initialData?.publisherRole || 'gm'
  );
  const [actualGmName, setActualGmName] = useState(initialData?.actualGmName || '');

  // Contatos
  const [contacts, setContacts] = useState<ContactFormEntry[]>(
    initialData?.contacts || [{
      channel: 'whatsapp',
      value: '',
      label: '',
      discord_server_url: '',
    }]
  );
  const [contactsError, setContactsError] = useState<string | null>(null);

  // Finalização
  const [rulesNotes, setRulesNotes] = useState(initialData?.rulesNotes || '');
  const [bannerUrl, setBannerUrl] = useState(initialData?.bannerUrl || '');
  const [isCovilMesa, setIsCovilMesa] = useState(initialData?.isCovilMesa || false);
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // DDAL
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

  // Campos avançados
  const [masterDisplayName, setMasterDisplayName] = useState(initialData?.masterDisplayName || '');
  const [campaignLength, setCampaignLength] = useState(initialData?.campaignLength || '');
  const [levelRange, setLevelRange] = useState(initialData?.levelRange || '');
  const [billingText, setBillingText] = useState(initialData?.billingText || '');
  const [sessionZeroFree, setSessionZeroFree] = useState(initialData?.sessionZeroFree || false);
  const [synopsis, setSynopsis] = useState(initialData?.synopsis || '');
  const [styleText, setStyleText] = useState(initialData?.styleText || '');
  const [listingExcerpt, setListingExcerpt] = useState(initialData?.listingExcerpt || '');
  const [technicalRequirements, setTechnicalRequirements] = useState(
    initialData?.technicalRequirements || ''
  );
  const [requiresPc, setRequiresPc] = useState(initialData?.requiresPc || false);
  const [requiresCamera, setRequiresCamera] = useState(initialData?.requiresCamera || false);
  const [requiresMicrophone, setRequiresMicrophone] = useState(
    initialData?.requiresMicrophone || false
  );

  // Cenário e estilos
  const [settingName, setSettingName] = useState(initialData?.settingName || '');
  const [settingStyles, setSettingStyles] = useState<string[]>(initialData?.settingStyles || []);

  // Submit State Machine
  type SubmitState = 'idle' | 'validating' | 'submitting' | 'success' | 'error';
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Dirty State Tracking
  const [isDirty, setIsDirty] = useState(false);

  // Aviso ao sair da página com mudanças não salvas
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && mode === 'create') {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, mode]);

  // Construir estado completo
  const formState: FormState = {
    form,
    selectedSystemId,
    selectedScenarioId,
    sessions,
    publisherRole,
    actualGmName,
    contacts,
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

  // Função de submissão com state machine
  const submit = async () => {
    setSubmitState('submitting');
    setError(null);
    setContactsError(null);

    try {
      const payload = formStateToPayload(formState);

      const endpoint = mode === 'review' && candidateId
        ? `/api/v1/aggregator/candidates/${candidateId}/accept`
        : '/api/v1/gm/tables';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Erro ao criar mesa');
      }

      setSubmitState('success');
      setIsDirty(false); // Limpar dirty após sucesso
      onSuccess();
    } catch (err: any) {
      setSubmitState('error');
      setError(err.message || 'Erro inesperado');
    }
  };

  // Computed: loading (compatibilidade com componentes existentes)
  const loading = submitState === 'submitting' || submitState === 'validating';

  // Form Controller - Camada de orquestração
  const controller = {
    /**
     * Atualiza múltiplos campos do form de uma vez
     */
    updateForm: (updates: Partial<typeof form>) => {
      setIsDirty(true);
      setForm(prev => ({ ...prev, ...updates }));
    },

    /**
     * Reset completo do formulário
     */
    reset: () => {
      setForm({
        title: '',
        description: '',
        type: 'campaign',
        modality: 'online',
        audience: 'livre',
        price_type: 'free',
        price_value: '',
        slots_total: '4',
        experience_level: 'todos',
        language: 'pt-BR',
      });
      setSelectedSystemId('');
      setSelectedScenarioId(null);
      setSessions([{
        day_of_week: 'segunda',
        start_time: '19:00',
        end_time: '22:00',
        frequency: 'semanal',
        slots_per_session: null,
        is_ongoing: false,
        notes: '',
        sort_order: 0,
      }]);
      setContacts([{
        channel: 'whatsapp',
        value: '',
        label: '',
        discord_server_url: '',
      }]);
      setError(null);
      setContactsError(null);
      setIsDirty(false);
    },

    /**
     * Submit com validação prévia
     * Retorna true se submeteu, false se validação falhou
     */
    submitIfValid: async (): Promise<boolean> => {
      setSubmitState('validating');
      
      // Validação completa usando validators
      const { validateAll } = await import('../utils/validation');
      const errors = validateAll(formState);
      
      if (errors.length > 0) {
        setSubmitState('error');
        setError(errors.join('; '));
        return false;
      }

      await submit();
      return submitState === 'success';
    },
  };

  return {
    // Estado do formulário
    form,
    setForm,
    
    // Sistema e cenário
    selectedSystemId,
    setSelectedSystemId,
    selectedScenarioId,
    setSelectedScenarioId,
    
    // Sessões
    sessions,
    setSessions,
    
    // Configuração
    publisherRole,
    setPublisherRole,
    actualGmName,
    setActualGmName,
    
    // Contatos
    contacts,
    setContacts,
    contactsError,
    setContactsError,
    
    // Finalização
    rulesNotes,
    setRulesNotes,
    bannerUrl,
    setBannerUrl,
    bannerError,
    setBannerError,
    avatarError,
    setAvatarError,
    isCovilMesa,
    setIsCovilMesa,
    ddal,
    setDdal,
    
    // Campos avançados
    masterDisplayName,
    setMasterDisplayName,
    campaignLength,
    setCampaignLength,
    levelRange,
    setLevelRange,
    billingText,
    setBillingText,
    sessionZeroFree,
    setSessionZeroFree,
    synopsis,
    setSynopsis,
    styleText,
    setStyleText,
    listingExcerpt,
    setListingExcerpt,
    technicalRequirements,
    setTechnicalRequirements,
    requiresPc,
    setRequiresPc,
    requiresCamera,
    setRequiresCamera,
    requiresMicrophone,
    setRequiresMicrophone,
    
    // Cenário e estilos
    settingName,
    setSettingName,
    settingStyles,
    setSettingStyles,
    
    // Estado completo (para hooks)
    formState,
    
    // Submissão
    submit,
    loading,
    submitState,
    error,
    setError,

    // Dirty state
    isDirty,

    // Controller (orquestração de alto nível)
    controller,
  };
}

