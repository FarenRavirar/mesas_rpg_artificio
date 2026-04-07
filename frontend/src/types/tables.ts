export type TableStatus = 'draft' | 'active' | 'full' | 'cancelled' | 'ended' | 'pending_review';
export type TableModality = 'online' | 'presencial' | 'hibrida';
export type PriceType = 'gratuita' | 'paga';
export type ExperienceLevel = 'todos' | 'iniciante' | 'intermediario' | 'veterano';
export type CatalogSeal = 'ddal' | 'covil-do-lich' | '';
export type PublisherRole = 'gm' | 'announcer';
export type TableContactChannel = 'whatsapp' | 'discord' | 'phone' | 'email' | 'facebook' | 'instagram' | 'form';

export interface TableContact {
  channel: TableContactChannel;
  value: string;
  label: string | null;
  discord_server_url: string | null;
  sort_order: number;
}

export type DayOfWeek = 'segunda' | 'terça' | 'quarta' | 'quinta' | 'sexta' | 'sábado' | 'domingo';
export type ScheduleFrequency = 'semanal' | 'quinzenal' | 'mensal' | 'avulsa';

export interface TableSchedule {
  id: string;
  day_of_week: DayOfWeek;
  start_time: string; // HH:MM:SS
  end_time: string | null;
  frequency: ScheduleFrequency;
  slots_per_session: number | null;
  is_ongoing: boolean;
  notes: string | null;
  sort_order: number;
}

export interface TableCard {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  status: TableStatus;
  type: string;
  audience: string;
  modality: TableModality;
  price_type: PriceType;
  price_value: number | null;
  slots_total: number;
  slots_filled: number;
  slots_open: number; // REQ-02: Vagas abertas para recrutamento
  language: string;
  experience_level: ExperienceLevel;
  featured: boolean;
  publisher_role: PublisherRole;
  actual_gm_name: string | null;
  contacts: TableContact[];
  system_name: string | null;
  system_slug: string | null;
  gm_slug: string | null;
  gm_avatar_url: string | null;
  gm_display_name: string | null;
  is_ddal: boolean;
  is_covil: boolean; // CORREÇÃO C01: Padronizado para is_covil (mesmo nome do backend)
  ddal_code?: string | null;
  ddal_name?: string | null;
  ddal_tier?: number | null;
  created_at: string;
  metrics?: {
    views: number;
    clicks: number;
    contacts: number;
    favorites: number;
  };
  synopsis_narrative?: string | null;
  score?: number;
  // CORREÇÃO REG-09: Adicionar campos de cenário e estilos
  setting_name?: string | null;
  setting_styles?: string[] | null;
}

export interface TableDetail extends TableCard {
  price_frequency: string | null;
  starts_at: string | null;
  city: string | null;
  state: string | null;
  content_warnings: string[];
  safety_tools: string[];
  gm_bio: string | null;
  scenario_name?: string | null;
  scenario_subgenres?: string[];
  schedules?: TableSchedule[];
  origin?: 'manual' | 'imported';
  ddal_season?: string | null;
  ddal_duration?: string | null;
  ddal_format?: string | null;
  ddal_org_code?: string | null;
  ddal_setting?: string | null;
  ddal_rules_notes?: string | null;
  // Campos avançados (REQ-26)
  master_display_name?: string | null;
  campaign_length?: string | null;
  level_range?: string | null;
  billing_text?: string | null;
  session_zero_free?: boolean;
  synopsis?: string | null;
  style_text?: string | null;
  listing_excerpt?: string | null;
  technical_requirements?: string | null;
  requires_pc?: boolean;
  requires_camera?: boolean;
  requires_microphone?: boolean;
  // Campos de cenário e estilos (REQ-28)
  setting_name?: string | null;
  setting_styles?: string[] | null;
  // REQ-28 Fase 7: Campos editoriais separados
  synopsis_narrative?: string | null;
  benefits_text?: string | null;
}

export interface TablesResponse {
  data: TableCard[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
    total?: number; // CORREÇÃO DT-05: Total de mesas ativas
  };
}
