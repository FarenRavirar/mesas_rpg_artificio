export type DiscordImportSourceKind = 'discord_bot' | 'discord_chat_exporter_json';
export type DiscordSourceChannelType = 'text' | 'announcement' | 'forum';
export type DiscordImportMessageStatus = 'pending' | 'parsed' | 'needs_review' | 'synced' | 'ignored' | 'error';
export type DiscordImportDraftStatus = 'draft' | 'ready' | 'needs_review' | 'synced' | 'rejected';

export interface DiscordSource {
  id: string;
  guild_id: string;
  channel_id: string;
  channel_name: string | null;
  channel_type: DiscordSourceChannelType;
  enabled: boolean;
  auto_sync_enabled: boolean;
  last_message_id: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscordDiscoveredGuild {
  id: string;
  name: string;
  icon: string | null;
  approximate_member_count: number | null;
}

export interface DiscordDiscoveredChannel {
  id: string;
  guild_id: string;
  name: string;
  type: number;
  kind: DiscordSourceChannelType;
  position: number | null;
  parent_id: string | null;
  parent_name: string | null;
}

export interface DiscordMessage {
  id: string;
  source_id: string;
  discord_message_id: string;
  discord_channel_id: string;
  discord_guild_id: string;
  discord_parent_channel_id: string | null;
  discord_thread_id: string | null;
  discord_thread_name: string | null;
  discord_author_id: string | null;
  discord_author_name: string | null;
  discord_message_url: string | null;
  content_raw: string;
  attachments: unknown[];
  embeds: unknown[];
  message_created_at: string | null;
  message_edited_at: string | null;
  content_hash: string;
  source_kind: DiscordImportSourceKind;
  status: DiscordImportMessageStatus;
  parse_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscordDraft {
  id: string;
  discord_message_id: string;
  table_id: string | null;
  parsed_payload: Record<string, unknown>;
  normalized_payload: Record<string, unknown> | null;
  confidence: number | null;
  status: DiscordImportDraftStatus;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface IngestResult {
  inserted: number;
  updated: number;
  total: number;
  newestMessageId: string | null;
  threadsScanned: number;
  sourceKind: DiscordSourceChannelType;
  parse?: {
    processed: number;
    succeeded: number;
    ignored: number;
    failed: number;
  };
}

export interface DiscordFetchWindow {
  since?: string;
  until?: string;
}

export interface DiscordMessageContentDiagnostic {
  discord_message_id: string;
  discord_channel_id: string;
  discord_thread_name: string | null;
  db_content_length: number;
  api_content_length: number;
  api_attachments_count: number;
  api_embeds_count: number;
  api_content_preview: string;
  likely_missing_message_content_intent: boolean;
  diagnosis: string;
}

export interface SyncReadyResult {
  synced: number;
  failed: number;
  errors: string[];
}

export interface DiscordBotTokenSettings {
  is_set: boolean;
  preview: string | null;
  updated_at: string | null;
}

export interface DiscordSettings {
  bot_token: DiscordBotTokenSettings;
}
