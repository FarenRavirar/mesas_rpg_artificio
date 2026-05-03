export type DiscordImportSourceKind = 'discord_bot' | 'discord_chat_exporter_json';
export type DiscordImportMessageStatus = 'pending' | 'parsed' | 'needs_review' | 'synced' | 'ignored' | 'error';
export type DiscordImportDraftStatus = 'draft' | 'ready' | 'needs_review' | 'synced' | 'rejected';

export interface DiscordSource {
  id: string;
  guild_id: string;
  channel_id: string;
  channel_name: string | null;
  enabled: boolean;
  auto_sync_enabled: boolean;
  last_message_id: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscordMessage {
  id: string;
  source_id: string;
  discord_message_id: string;
  discord_channel_id: string;
  discord_guild_id: string;
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
}

export interface SyncReadyResult {
  synced: number;
  failed: number;
  errors: string[];
}
