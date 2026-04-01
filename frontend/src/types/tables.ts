export type TableStatus = 'draft' | 'active' | 'full' | 'cancelled' | 'ended' | 'pending_review';
export type TableModality = 'online' | 'presencial' | 'hibrida';
export type PriceType = 'gratuita' | 'paga';
export type ExperienceLevel = 'todos' | 'iniciante' | 'intermediario' | 'veterano';

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
  experience_level: ExperienceLevel;
  featured: boolean;
  system_name: string | null;
  system_slug: string | null;
  gm_slug: string | null;
  gm_avatar_url: string | null;
  created_at: string;
}

export interface TablesResponse {
  data: TableCard[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}
