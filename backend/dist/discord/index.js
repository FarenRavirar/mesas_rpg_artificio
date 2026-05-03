"use strict";
/**
 * Fronteira pública do módulo Discord.
 * Todo código fora de backend/src/discord/ deve importar exclusivamente daqui.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncDiscordDraftToTable = exports.ingestMessages = exports.DiscordDiscoveryError = exports.discoverDiscordGuilds = exports.discoverDiscordChannels = exports.discordConfig = void 0;
// Configuração
var config_1 = require("./config");
Object.defineProperty(exports, "discordConfig", { enumerable: true, get: function () { return config_1.discordConfig; } });
// Funções de pipeline (adicionadas conforme implementação das Fases 2–4)
var discovery_1 = require("./discovery");
Object.defineProperty(exports, "discoverDiscordChannels", { enumerable: true, get: function () { return discovery_1.discoverDiscordChannels; } });
Object.defineProperty(exports, "discoverDiscordGuilds", { enumerable: true, get: function () { return discovery_1.discoverDiscordGuilds; } });
Object.defineProperty(exports, "DiscordDiscoveryError", { enumerable: true, get: function () { return discovery_1.DiscordDiscoveryError; } });
var ingestMessages_1 = require("./ingestMessages");
Object.defineProperty(exports, "ingestMessages", { enumerable: true, get: function () { return ingestMessages_1.ingestMessages; } });
// export { parseDiscordAnnouncement } from './parseDiscordAnnouncement';
// export { normalizeDiscordTableDraft } from './normalizeDiscordTableDraft';
var syncDiscordDraftToTable_1 = require("./syncDiscordDraftToTable");
Object.defineProperty(exports, "syncDiscordDraftToTable", { enumerable: true, get: function () { return syncDiscordDraftToTable_1.syncDiscordDraftToTable; } });
