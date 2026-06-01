"use strict";
/**
 * Fronteira pública do módulo Discord.
 * Todo código fora de backend/src/discord/ deve importar exclusivamente daqui.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDiscordImageToCloudinary = exports.assertDraftReadyTransition = exports.syncDiscordDraftToTable = exports.refreshDiscordDraftImage = exports.DiscordDraftSyncValidationError = exports.normalizeDiscordTableDraft = exports.parseDiscordAnnouncement = exports.ingestMessages = exports.ingestForumMessages = exports.DiscordIngestError = exports.DiscordDiscoveryError = exports.discoverDiscordGuilds = exports.discoverDiscordChannels = exports.discordConfig = void 0;
// Configuração
var config_1 = require("./config");
Object.defineProperty(exports, "discordConfig", { enumerable: true, get: function () { return config_1.discordConfig; } });
// Funções de pipeline (adicionadas conforme implementação das Fases 2–4)
var discovery_1 = require("./discovery");
Object.defineProperty(exports, "discoverDiscordChannels", { enumerable: true, get: function () { return discovery_1.discoverDiscordChannels; } });
Object.defineProperty(exports, "discoverDiscordGuilds", { enumerable: true, get: function () { return discovery_1.discoverDiscordGuilds; } });
Object.defineProperty(exports, "DiscordDiscoveryError", { enumerable: true, get: function () { return discovery_1.DiscordDiscoveryError; } });
var ingestMessages_1 = require("./ingestMessages");
Object.defineProperty(exports, "DiscordIngestError", { enumerable: true, get: function () { return ingestMessages_1.DiscordIngestError; } });
Object.defineProperty(exports, "ingestForumMessages", { enumerable: true, get: function () { return ingestMessages_1.ingestForumMessages; } });
Object.defineProperty(exports, "ingestMessages", { enumerable: true, get: function () { return ingestMessages_1.ingestMessages; } });
var parseDiscordAnnouncement_1 = require("./parseDiscordAnnouncement");
Object.defineProperty(exports, "parseDiscordAnnouncement", { enumerable: true, get: function () { return parseDiscordAnnouncement_1.parseDiscordAnnouncement; } });
var normalizeDiscordTableDraft_1 = require("./normalizeDiscordTableDraft");
Object.defineProperty(exports, "normalizeDiscordTableDraft", { enumerable: true, get: function () { return normalizeDiscordTableDraft_1.normalizeDiscordTableDraft; } });
var syncDiscordDraftToTable_1 = require("./syncDiscordDraftToTable");
Object.defineProperty(exports, "DiscordDraftSyncValidationError", { enumerable: true, get: function () { return syncDiscordDraftToTable_1.DiscordDraftSyncValidationError; } });
Object.defineProperty(exports, "refreshDiscordDraftImage", { enumerable: true, get: function () { return syncDiscordDraftToTable_1.refreshDiscordDraftImage; } });
Object.defineProperty(exports, "syncDiscordDraftToTable", { enumerable: true, get: function () { return syncDiscordDraftToTable_1.syncDiscordDraftToTable; } });
var draftValidation_1 = require("./draftValidation");
Object.defineProperty(exports, "assertDraftReadyTransition", { enumerable: true, get: function () { return draftValidation_1.assertDraftReadyTransition; } });
var uploadDiscordImage_1 = require("./uploadDiscordImage");
Object.defineProperty(exports, "uploadDiscordImageToCloudinary", { enumerable: true, get: function () { return uploadDiscordImage_1.uploadDiscordImageToCloudinary; } });
