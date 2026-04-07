"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sourceService = void 0;
const aggregator_1 = require("../../db/aggregator");
const normalizeOptionalText = (value) => {
    if (value === undefined)
        return undefined;
    if (value === null)
        return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
};
exports.sourceService = {
    async list() {
        return (0, aggregator_1.listAggregatorSources)();
    },
    async getById(sourceId) {
        return (0, aggregator_1.getAggregatorSourceById)(sourceId);
    },
    async getByDiscordChannel(serverId, channelId) {
        return (0, aggregator_1.getAggregatorSourceByDiscordChannel)(serverId, channelId);
    },
    async create(input) {
        return (0, aggregator_1.createAggregatorSource)({
            ...input,
            notes: normalizeOptionalText(input.notes),
            defaultTimezone: normalizeOptionalText(input.defaultTimezone) ?? undefined,
        });
    },
    async update(sourceId, input) {
        return (0, aggregator_1.updateAggregatorSource)(sourceId, {
            ...input,
            notes: normalizeOptionalText(input.notes),
            defaultTimezone: normalizeOptionalText(input.defaultTimezone) ?? undefined,
        });
    },
    async setEnabled(sourceId, enabled) {
        return (0, aggregator_1.setAggregatorSourceEnabled)(sourceId, enabled);
    },
};
