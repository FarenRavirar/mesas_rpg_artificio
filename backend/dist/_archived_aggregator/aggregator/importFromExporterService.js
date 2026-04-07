"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importFromExporterService = void 0;
const normalizeExporterPayload_1 = require("../../domain/aggregator/normalizeExporterPayload");
const rawImportService_1 = require("./rawImportService");
const sourceService_1 = require("./sourceService");
const resolveSource = async (sourceId, guildId, channelId) => {
    if (sourceId) {
        const source = await sourceService_1.sourceService.getById(sourceId);
        if (!source) {
            throw new Error('Source não encontrada para o sourceId informado.');
        }
        return source;
    }
    if (!guildId || !channelId) {
        throw new Error('Não foi possível inferir a source: payload sem guildId/channelId e sourceId ausente.');
    }
    const source = await sourceService_1.sourceService.getByDiscordChannel(guildId, channelId);
    if (!source) {
        throw new Error('Nenhuma source cadastrada para o canal Discord informado no payload.');
    }
    return source;
};
exports.importFromExporterService = {
    async importPayload(input) {
        const normalizedPayload = await (0, normalizeExporterPayload_1.normalizeExporterPayload)(input.payload);
        const source = await resolveSource(input.sourceId, normalizedPayload.guildId, normalizedPayload.channelId);
        return rawImportService_1.rawImportService.importNormalizedPayload({
            payload: normalizedPayload,
            source: {
                id: source.id,
                allow_paid: source.allow_paid,
                publish_mode: source.publish_mode,
                server_id: source.server_id,
                channel_id: source.channel_id,
            },
            dryRun: input.dryRun === true,
        });
    },
};
