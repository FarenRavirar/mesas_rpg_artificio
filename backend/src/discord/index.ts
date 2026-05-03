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
export { ingestMessages } from './ingestMessages';
export type { IngestResult } from './ingestMessages';
// export { parseDiscordAnnouncement } from './parseDiscordAnnouncement';
// export { normalizeDiscordTableDraft } from './normalizeDiscordTableDraft';
export { syncDiscordDraftToTable } from './syncDiscordDraftToTable';
export type { SyncResult } from './syncDiscordDraftToTable';
