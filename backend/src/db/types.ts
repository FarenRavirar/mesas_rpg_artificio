import { Generated, Insertable, Selectable, Updateable } from 'kysely';

export type UserRole = 'visitor' | 'player' | 'gm' | 'admin';
export type SystemNodeType = 'system' | 'edition' | 'variant' | 'subsystem';
export type AuthProvider = 'google' | 'discord';
export type ExperienceLevelPlayer = 'iniciante' | 'intermediario' | 'veterano';
export type PreferredTime = 'manha' | 'tarde' | 'noite';
export type PricingPreference = 'free' | 'paid' | 'both';
export type UserSystemType = 'favorite' | 'gm';

export interface UsersTable {
  id: Generated<string>;
  google_id: string;
  email: string;
  username: string | null;
  location: string | null;
  role: Generated<UserRole>;
  refresh_token: string | null;
  privacy_public: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export interface AuthProvidersTable {
  id: Generated<string>;
  user_id: string;
  provider: AuthProvider;
  provider_user_id: string;
  provider_data: unknown | null;
  created_at: Generated<Date>;
}

export type AuthProvider_Record = Selectable<AuthProvidersTable>;
export type NewAuthProvider = Insertable<AuthProvidersTable>;
export type AuthProviderUpdate = Updateable<AuthProvidersTable>;

export interface ProfilesTable {
  id: Generated<string>;
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
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

export interface PlayerProfilesTable {
  user_id: string;
  experience_level: ExperienceLevelPlayer | null;
  playstyle: unknown | null; // JSONB: { combat: number, roleplay: number, exploration: number, strategy: number }
  preferred_days: string[] | null;
  preferred_time: PreferredTime | null;
  pricing_preference: PricingPreference | null;
  updated_at: Generated<Date>;
}

export type PlayerProfile = Selectable<PlayerProfilesTable>;
export type NewPlayerProfile = Insertable<PlayerProfilesTable>;
export type PlayerProfileUpdate = Updateable<PlayerProfilesTable>;

export interface UserSystemsTable {
  id: Generated<string>;
  user_id: string;
  system_id: string;
  type: UserSystemType;
  created_at: Generated<Date>;
}

export type UserSystem = Selectable<UserSystemsTable>;
export type NewUserSystem = Insertable<UserSystemsTable>;
export type UserSystemUpdate = Updateable<UserSystemsTable>;

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
  // Discord
  discord_connected: Generated<boolean>;
  discord_username: string | null;
  discord_id: string | null;
  // Selo Covil (controlado por admin)
  covil_verified: Generated<boolean>;
  covil_verified_at: Date | null;
  covil_verified_by: string | null;
  // Experiência e monetização
  experience_years: number | null;
  average_price: number | null;
  // Estilo de mestria (JSONB)
  gm_style: unknown | null; // { narrative: number, tactical: number, sandbox: number, railroad: number }
  tools: unknown | null; // string[] - ["Foundry VTT", "Discord", "Roll20"]
  game_format: unknown | null; // { session_length: string, frequency: string, group_size: string }
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type GmProfile = Selectable<GmProfilesTable>;
export type NewGmProfile = Insertable<GmProfilesTable>;
export type GmProfileUpdate = Updateable<GmProfilesTable>;

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

export interface ScenariosTable {
  id: Generated<string>;
  name: string;
  slug: string;
  subgenres: Generated<string[]>;
  created_at: Generated<Date>;
}

export type Scenario = Selectable<ScenariosTable>;
export type NewScenario = Insertable<ScenariosTable>;
export type ScenarioUpdate = Updateable<ScenariosTable>;

export type TableStatus = 'draft' | 'active' | 'full' | 'cancelled' | 'ended' | 'pending_review';
export type TableType = 'campanha' | 'one-shot' | 'oneshot-serie' | 'aberta';
export type TableAudience = 'livre' | 'adultos';
export type TableModality = 'online' | 'presencial' | 'hibrida';
export type PriceType = 'gratuita' | 'paga';
export type PriceFrequency = 'sessao' | 'mes' | 'campanha';
export type ExperienceLevel = 'todos' | 'iniciante' | 'intermediario' | 'veterano';
export type PublisherRole = 'gm' | 'announcer';
export type TableContactChannel = 'whatsapp' | 'discord' | 'phone' | 'email' | 'facebook' | 'instagram' | 'form';
export type TableOrigin = 'manual' | 'imported';
export type AggregatorPlatform = 'discord';
export type AggregatorPublishMode = 'manual_review' | 'auto_publish';
export type AggregatorEditorialStatus = 'accepted' | 'rejected' | 'awaiting_review';

export interface TablesTable {
  id: Generated<string>;
  slug: string;
  gm_id: string | null;
  system_id: string | null;
  scenario_id: string | null;
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
  origin: Generated<TableOrigin>;
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
  is_covil: Generated<boolean>;
  imported_expires_at: Date | null;
  frequency: 'semanal' | 'quinzenal' | 'mensal' | 'outros' | null;
  frequency_custom: string | null;
  rules_notes: string | null;
  banner_url: string | null;
  master_display_name: string | null;
  campaign_length: string | null;
  level_range: string | null;
  billing_text: string | null;
  session_zero_free: Generated<boolean>;
  synopsis: string | null;
  style_text: string | null;
  listing_excerpt: string | null;
  technical_requirements: string | null;
  requires_pc: Generated<boolean>;
  requires_camera: Generated<boolean>;
  requires_microphone: Generated<boolean>;
  setting_name: string | null;
  setting_styles: string[] | null;
  synopsis_narrative: string | null;
  benefits_text: string | null;
  gm_bio: string | null;
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

export type DayOfWeek = 'segunda' | 'terça' | 'quarta' | 'quinta' | 'sexta' | 'sábado' | 'domingo';
export type ScheduleFrequency = 'semanal' | 'quinzenal' | 'mensal' | 'avulsa';

export interface TableSchedulesTable {
  id: Generated<string>;
  table_id: string;
  day_of_week: DayOfWeek;
  start_time: string; // TIME stored as string "HH:MM:SS"
  end_time: string | null;
  frequency: ScheduleFrequency;
  slots_per_session: number | null;
  is_ongoing: Generated<boolean>;
  notes: string | null;
  sort_order: Generated<number>;
  created_at: Generated<Date>;
}

export type TableSchedule = Selectable<TableSchedulesTable>;
export type NewTableSchedule = Insertable<TableSchedulesTable>;
export type TableScheduleUpdate = Updateable<TableSchedulesTable>;

export interface SettingStyleSuggestionsTable {
  id: Generated<string>;
  setting_name: string;
  suggested_styles: string[];
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type SettingStyleSuggestion = Selectable<SettingStyleSuggestionsTable>;
export type NewSettingStyleSuggestion = Insertable<SettingStyleSuggestionsTable>;
export type SettingStyleSuggestionUpdate = Updateable<SettingStyleSuggestionsTable>;

export interface AggregatorSourcesTable {
  id: Generated<string>;
  name: string;
  platform: Generated<AggregatorPlatform>;
  server_id: string;
  channel_id: string;
  enabled: Generated<boolean>;
  allow_paid: Generated<boolean>;
  publish_mode: Generated<AggregatorPublishMode>;
  default_timezone: Generated<string>;
  notes: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface AggregatorImportedRawMessagesTable {
  id: Generated<string>;
  source_id: string;
  external_id: string;
  raw_text: string;
  author_name: string | null;
  author_discord_id: string | null;
  message_url: string | null;
  processed: Generated<boolean>;
  message_created_at: Date | null;
  raw_payload: unknown;
  processing_attempts: Generated<number>;
  last_processing_error: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface AggregatorImportCandidatesTable {
  id: Generated<string>;
  source_id: string;
  raw_message_id: string;
  external_id: string;
  parsed_json: unknown;
  confidence_score: Generated<number>;
  editorial_status: Generated<AggregatorEditorialStatus>;
  publish_mode: Generated<AggregatorPublishMode>;
  publish_at: Date | null;
  rejection_reason: string | null;
  published_table_id: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export interface AggregatorSettingsTable {
  key: string;
  value: unknown;
  updated_at: Generated<Date>;
}

export type SuggestionStatus = 'pending' | 'approved' | 'rejected';

export interface SystemSuggestionsTable {
  id: Generated<string>;
  user_id: string;
  name: string;
  node_type: SystemNodeType;
  parent_id: string | null;
  description: string | null;
  aliases: string[] | null;
  status: Generated<SuggestionStatus>;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  rejection_reason: string | null;
  user_notified: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type SystemSuggestion = Selectable<SystemSuggestionsTable>;
export type NewSystemSuggestion = Insertable<SystemSuggestionsTable>;
export type SystemSuggestionUpdate = Updateable<SystemSuggestionsTable>;

export type NotificationType = 'suggestion_approved' | 'suggestion_rejected' | 'suggestion_edited' | 'system';

export interface NotificationsTable {
  id: Generated<string>;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: Generated<boolean>;
  created_at: Generated<Date>;
}

export type Notification = Selectable<NotificationsTable>;
export type NewNotification = Insertable<NotificationsTable>;
export type NotificationUpdate = Updateable<NotificationsTable>;

export interface UserLinksTable {
  id: Generated<string>;
  user_id: string;
  url: string;
  type: string;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  sort_order: Generated<number>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type UserLinks = Selectable<UserLinksTable>;
export type NewUserLink = Insertable<UserLinksTable>;
export type UserLinkUpdate = Updateable<UserLinksTable>;

export interface Database {
  users: UsersTable;
  auth_providers: AuthProvidersTable;
  profiles: ProfilesTable;
  user_preferences: UserPreferencesTable;
  player_profiles: PlayerProfilesTable;
  user_systems: UserSystemsTable;
  gm_profiles: GmProfilesTable;
  systems: SystemsTable;
  system_aliases: SystemAliasesTable;
  system_suggestions: SystemSuggestionsTable;
  notifications: NotificationsTable;
  tags: TagsTable;
  platforms: PlatformsTable;
  scenarios: ScenariosTable;
  tables: TablesTable;
  table_contacts: TableContactsTable;
  table_schedules: TableSchedulesTable;
  setting_style_suggestions: SettingStyleSuggestionsTable;
  aggregator_sources: AggregatorSourcesTable;
  aggregator_imported_raw_messages: AggregatorImportedRawMessagesTable;
  aggregator_import_candidates: AggregatorImportCandidatesTable;
  aggregator_settings: AggregatorSettingsTable;
  user_links: UserLinksTable;
}


