import type { SessionSchedule } from '../../../components/SessionRepeater';
import type { ContactFormEntry } from '../../../components/ContactsFormBlock';

export type FormStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface DdalFormState {
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

export interface BasicFormData {
  title: string;
  description: string;
  type: string;
  modality: string;
  audience: string;
  price_type: string;
  price_value: string;
  slots_total: string;
  experience_level: string;
  language: string;
}

export interface FormState {
  // Dados básicos
  form: BasicFormData;
  
  // Sistema e cenário
  selectedSystemId: string;
  selectedScenarioId: string | null;
  
  // Sessões
  sessions: SessionSchedule[];
  
  // Configuração
  publisherRole: 'gm' | 'announcer';
  actualGmName: string;
  
  // Contatos
  contacts: ContactFormEntry[];
  
  // Finalização
  rulesNotes: string;
  bannerUrl: string;
  isCovilMesa: boolean;
  ddal: DdalFormState;
  
  // Campos avançados
  masterDisplayName: string;
  campaignLength: string;
  levelRange: string;
  billingText: string;
  sessionZeroFree: boolean;
  synopsis: string;
  styleText: string;
  listingExcerpt: string;
  technicalRequirements: string;
  requiresPc: boolean;
  requiresCamera: boolean;
  requiresMicrophone: boolean;
  
  // Cenário e estilos
  settingName: string;
  settingStyles: string[];
}

export interface CreateTablePayload {
  title: string;
  description: string;
  type: string;
  modality: string;
  price_type: string;
  slots_total: number;
  language: string;
  system_id: string;
  scenario_id: string | null;
  sessions: SessionSchedule[];
  contacts: Array<{
    channel: string;
    value: string;
    label?: string;
    discord_server_url?: string;
  }>;
  publisher_role: 'gm' | 'announcer';
  actual_gm_name: string | null;
  rules_notes: string;
  banner_url: string;
  is_covil: boolean;
  is_ddal: boolean;
  ddal_code?: string;
  ddal_name?: string;
  ddal_tier?: number;
  ddal_season?: string;
  ddal_duration?: string;
  ddal_format?: string;
  ddal_org_code?: string;
  ddal_setting?: string;
  ddal_rules_notes?: string;
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
  setting_name?: string;
  setting_styles?: string[];
}

export type DraftStatus = 'idle' | 'saving' | 'saved';
