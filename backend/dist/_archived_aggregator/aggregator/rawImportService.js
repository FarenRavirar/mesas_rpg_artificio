"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawImportService = void 0;
const aggregator_1 = require("../../db/aggregator");
const db_1 = require("../../db");
const normalizeCandidate_1 = require("../../domain/aggregator/normalizeCandidate");
const parseExporterMessage_1 = require("../../domain/aggregator/parseExporterMessage");
const classifySystem_1 = require("../../domain/aggregator/classifySystem");
const publishService_1 = require("./publishService");
const toDateOrNull = (value) => {
    if (!value)
        return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const toErrorMessage = (error) => {
    if (error instanceof Error)
        return error.message;
    return 'Falha não mapeada durante o processamento da mensagem.';
};
const buildMessageUrl = (guildId, channelId, messageId) => {
    if (!guildId || !channelId)
        return null;
    return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
};
const buildSummary = (payload, dryRun) => ({
    totalMessages: payload.messages.length,
    imported: 0,
    accepted: 0,
    awaitingReview: 0,
    rejected: 0,
    failed: 0,
    dryRun,
    results: [],
});
const loadKnownAliases = async () => {
    const rows = await db_1.db
        .selectFrom('system_aliases as alias')
        .innerJoin('systems as system', 'system.id', 'alias.system_id')
        .select([
        'system.id as system_id',
        'system.name as system_name',
        'alias.alias as alias',
    ])
        .execute();
    return rows
        .map((row) => ({
        systemId: row.system_id,
        systemName: row.system_name,
        alias: row.alias,
        aliasNormalized: (0, classifySystem_1.normalizeSystemAlias)(row.alias),
    }))
        .filter((row) => row.aliasNormalized.length > 0);
};
const parseAndNormalizeMessage = (payload, source, message, knownSystemAliases) => {
    const draft = (0, parseExporterMessage_1.parseExporterMessage)({
        message,
        sourceChannelId: payload.channelId ?? source.channel_id,
        knownSystemAliases,
    });
    const normalized = (0, normalizeCandidate_1.normalizeCandidate)({
        draft,
        allowPaid: source.allow_paid,
        publishMode: source.publish_mode,
    });
    const publishAt = publishService_1.publishService.resolvePublishAt(normalized.editorialStatus, normalized.publishMode);
    return { draft, normalized, publishAt };
};
exports.rawImportService = {
    async importNormalizedPayload(input) {
        const summary = buildSummary(input.payload, input.dryRun);
        const knownSystemAliases = await loadKnownAliases();
        for (const message of input.payload.messages) {
            let rawMessageId = null;
            try {
                if (!input.dryRun) {
                    const rawRecord = await (0, aggregator_1.upsertAggregatorRawMessage)({
                        sourceId: input.source.id,
                        externalId: message.id,
                        rawText: message.content,
                        authorName: message.author.nickname ?? message.author.name,
                        authorDiscordId: message.author.id,
                        messageUrl: buildMessageUrl(input.payload.guildId, input.payload.channelId, message.id),
                        messageCreatedAt: toDateOrNull(message.timestamp),
                        rawPayload: message.rawPayload,
                    });
                    rawMessageId = rawRecord.id;
                }
                const { normalized, publishAt } = parseAndNormalizeMessage(input.payload, input.source, message, knownSystemAliases);
                if (!input.dryRun && rawMessageId) {
                    await (0, aggregator_1.upsertAggregatorCandidate)({
                        sourceId: input.source.id,
                        rawMessageId,
                        externalId: message.id,
                        parsedJson: normalized.parsedJson,
                        confidenceScore: normalized.confidenceScore,
                        editorialStatus: normalized.editorialStatus,
                        publishMode: normalized.publishMode,
                        publishAt,
                        rejectionReason: normalized.rejectionReason,
                        publishedTableId: null,
                    });
                    await (0, aggregator_1.markAggregatorRawMessageProcessed)(rawMessageId, {
                        processed: true,
                        errorMessage: null,
                    });
                }
                summary.imported += 1;
                if (normalized.editorialStatus === 'accepted')
                    summary.accepted += 1;
                if (normalized.editorialStatus === 'awaiting_review')
                    summary.awaitingReview += 1;
                if (normalized.editorialStatus === 'rejected')
                    summary.rejected += 1;
                summary.results.push({
                    messageId: message.id,
                    editorialStatus: normalized.editorialStatus,
                    confidenceScore: normalized.confidenceScore,
                    reason: normalized.rejectionReason,
                });
            }
            catch (error) {
                const errorMessage = toErrorMessage(error);
                if (!input.dryRun && rawMessageId) {
                    await (0, aggregator_1.markAggregatorRawMessageProcessed)(rawMessageId, {
                        processed: false,
                        errorMessage,
                    });
                }
                summary.failed += 1;
                summary.results.push({
                    messageId: message.id,
                    editorialStatus: 'failed',
                    confidenceScore: null,
                    reason: errorMessage,
                });
            }
        }
        return summary;
    },
};
