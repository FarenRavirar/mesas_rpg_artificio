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
  is_ddal?: boolean;
  ddal_code?: string | null;
  ddal_name?: string | null;
  ddal_tier?: number | null;
  created_at: string;
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
  ddal_season?: string | null;
  ddal_duration?: string | null;
  ddal_format?: string | null;
  ddal_org_code?: string | null;
  ddal_setting?: string | null;
  ddal_rules_notes?: string | null;
}

export interface TablesResponse {
  data: TableCard[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}
