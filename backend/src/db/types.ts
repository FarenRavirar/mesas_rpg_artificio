import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export type UserRole = 'visitor' | 'player' | 'gm' | 'admin';
export type SystemNodeType = 'system' | 'edition' | 'variant' | 'subsystem';

export interface UsersTable {
  id: Generated<string>;
  google_id: string;
  email: string;
  role: Generated<UserRole>;
  refresh_token: string | null;
  privacy_public: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export interface ProfilesTable {
  id: Generated<string>;
  user_id: string;
  display_name: string;
  bio: string | null;
  languages: Generated<string[]>;
  tags: Generated<string[]>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Profile = Selectable<ProfilesTable>;
export type NewProfile = Insertable<ProfilesTable>;

export interface UserPreferencesTable {
  id: Generated<string>;
  user_id: string;
  systems: Generated<string[]>;
  tags: Generated<string[]>;
  languages: Generated<string[]>;
  platforms: Generated<string[]>;
  weekdays: Generated<number[]>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type UserPreference = Selectable<UserPreferencesTable>;
export type NewUserPreference = Insertable<UserPreferencesTable>;
export type UserPreferenceUpdate = Updateable<UserPreferencesTable>;

export interface GmProfilesTable {
  id: Generated<string>;
  user_id: string;
  slug: string;
  nickname: string | null;
  bio_long: string | null;
  avatar_url: string | null;
  avatar_deletehash: string | null;
  avatar_imgur_id: string | null;
  banner_url: string | null;
  banner_deletehash: string | null;
  banner_imgur_id: string | null;
  languages: Generated<string[]>;
  specialties: Generated<string[]>;
  badges: Generated<string[]>;
  tables_count: Generated<number>;
  avg_rating: number | null;
  reviews_count: Generated<number>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface SystemsTable {
  id: Generated<string>;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  node_type: Generated<SystemNodeType>;
  depth: Generated<number>;
  path_slug: string | null;
  created_at: Generated<Date>;
}

export interface SystemAliasesTable {
  id: Generated<string>;
  system_id: string;
  alias: string;
  alias_slug: string;
  is_official: Generated<boolean>;
  created_at: Generated<Date>;
}

export interface TagsTable {
  id: Generated<string>;
  name: string;
  slug: string;
  created_at: Generated<Date>;
}

export interface PlatformsTable {
  id: Generated<string>;
  name: string;
  slug: string;
  created_at: Generated<Date>;
}

export type TableStatus = 'draft' | 'active' | 'full' | 'cancelled' | 'ended' | 'pending_review';
export type TableType = 'campanha' | 'one-shot' | 'oneshot-serie' | 'aberta';
export type TableAudience = 'livre' | 'adultos';
export type TableModality = 'online' | 'presencial' | 'hibrida';
export type PriceType = 'gratuita' | 'paga';
export type PriceFrequency = 'sessao' | 'mes' | 'campanha';
export type ExperienceLevel = 'todos' | 'iniciante' | 'intermediario' | 'veterano';
export type PublisherRole = 'gm' | 'announcer';
export type TableContactChannel = 'whatsapp' | 'discord' | 'phone' | 'email' | 'facebook' | 'instagram' | 'form';

export interface TablesTable {
  id: Generated<string>;
  slug: string;
  gm_id: string | null;
  system_id: string | null;
  title: string;
  description: string | null;
  cover_url: string | null;
  cover_deletehash: string | null;
  cover_imgur_id: string | null;
  status: Generated<TableStatus>;
  type: TableType;
  audience: Generated<TableAudience>;
  modality: Generated<TableModality>;
  price_type: Generated<PriceType>;
  price_value: number | null;
  price_frequency: PriceFrequency | null;
  slots_total: Generated<number>;
  slots_filled: Generated<number>;
  language: Generated<string>;
  experience_level: Generated<ExperienceLevel>;
  starts_at: Date | null;
  city: string | null;
  state: string | null;
  content_warnings: Generated<string[]>;
  safety_tools: Generated<string[]>;
  source_url: string | null;
  source_id: string | null;
  featured: Generated<boolean>;
  publisher_role: Generated<PublisherRole>;
  actual_gm_name: string | null;
  is_ddal: Generated<boolean>;
  ddal_code: string | null;
  ddal_name: string | null;
  ddal_tier: number | null;
  ddal_season: string | null;
  ddal_duration: string | null;
  ddal_format: string | null;
  ddal_org_code: string | null;
  ddal_setting: string | null;
  ddal_rules_notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface TableContactsTable {
  id: Generated<string>;
  table_id: string;
  channel: TableContactChannel;
  value: string;
  label: string | null;
  discord_server_url: string | null;
  sort_order: Generated<number>;
  created_at: Generated<Date>;
}

export interface Database {
  users: UsersTable;
  profiles: ProfilesTable;
  user_preferences: UserPreferencesTable;
  gm_profiles: GmProfilesTable;
  systems: SystemsTable;
  system_aliases: SystemAliasesTable;
  tags: TagsTable;
  platforms: PlatformsTable;
  tables: TablesTable;
  table_contacts: TableContactsTable;
}
