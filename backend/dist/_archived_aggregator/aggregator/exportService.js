"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportService = void 0;
const aggregator_1 = require("../../db/aggregator");
const formatForPublication_1 = require("../../domain/aggregator/formatForPublication");
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const isParsedMessageDraft = (value) => {
    if (!value || typeof value !== 'object')
        return false;
    const sourceMessageId = value.sourceMessageId;
    return typeof sourceMessageId === 'string' && sourceMessageId.trim().length > 0;
};
const toDateStringInSaoPaulo = (value) => {
    const formatted = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(value);
    return formatted;
};
const ensureDate = (date) => {
    const candidate = date?.trim();
    if (!candidate) {
        return toDateStringInSaoPaulo(new Date());
    }
    if (!DATE_PATTERN.test(candidate)) {
        throw new Error('Data inválida. Use o formato YYYY-MM-DD.');
    }
    return candidate;
};
exports.exportService = {
    async getDailyAccepted(dateInput) {
        const date = ensureDate(dateInput);
        const rows = await (0, aggregator_1.listAcceptedAggregatorCandidatesByDate)(date);
        const items = rows
            .filter((row) => isParsedMessageDraft(row.parsed_json))
            .map((row) => ({
            candidateId: row.id,
            externalId: row.external_id,
            sourceName: row.source_name,
            messageCreatedAt: row.message_created_at,
            parsedJson: row.parsed_json,
        }));
        return {
            date,
            total: items.length,
            items,
            text: (0, formatForPublication_1.formatForPublication)(items, date),
        };
    },
};
