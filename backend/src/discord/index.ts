/**
 * Fronteira pública do módulo Discord.
 * Todo código fora de backend/src/discord/ deve importar exclusivamente daqui.
 */

// Tipos públicos
export type {
  DiscordTableDraft,
  DiscordTableDraftSource,
  DiscordTableDraftTable,
  DiscordRawMessage,
  DiscordImportSourceKind,
  DiscordSourceChannelType,
  DiscordImportMessageStatus,
  DiscordImportDraftStatus,
  TableDraftType,
  TableDraftModality,
  TableDraftPriceType,
  TableDraftFrequency,
} from './types';

// Configuração
export { discordConfig } from './config';

// Funções de pipeline (adicionadas conforme implementação das Fases 2–4)
export { discoverDiscordChannels, discoverDiscordGuilds, DiscordDiscoveryError } from './discovery';
export type { DiscordDiscoveredChannel, DiscordDiscoveredGuild } from './discovery';
export { DiscordIngestError, ingestForumMessages, ingestMessages } from './ingestMessages';
export type { IngestResult } from './ingestMessages';
export { parseDiscordAnnouncement } from './parseDiscordAnnouncement';
export type { SystemEntry } from './parseDiscordAnnouncement';
export { syncDiscordDraftToTable } from './syncDiscordDraftToTable';
export type { SyncResult } from './syncDiscordDraftToTable';
