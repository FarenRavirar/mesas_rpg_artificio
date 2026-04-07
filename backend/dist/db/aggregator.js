"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAcceptedAggregatorCandidatesByDate = exports.updateAggregatorCandidateEditorialStatus = exports.getAggregatorCandidateById = exports.listAggregatorCandidates = exports.upsertAggregatorCandidate = exports.markAggregatorRawMessageProcessed = exports.upsertAggregatorRawMessage = exports.setAggregatorSourceEnabled = exports.updateAggregatorSource = exports.createAggregatorSource = exports.getAggregatorSourceByDiscordChannel = exports.getAggregatorSourceById = exports.listAggregatorSources = void 0;
const kysely_1 = require("kysely");
const index_1 = require("./index");
const listAggregatorSources = async () => {
    return index_1.db
        .selectFrom('aggregator_sources')
        .selectAll()
        .orderBy('created_at', 'desc')
        .execute();
};
exports.listAggregatorSources = listAggregatorSources;
const getAggregatorSourceById = async (sourceId) => {
    return index_1.db
        .selectFrom('aggregator_sources')
        .selectAll()
        .where('id', '=', sourceId)
        .executeTakeFirst();
};
exports.getAggregatorSourceById = getAggregatorSourceById;
const getAggregatorSourceByDiscordChannel = async (serverId, channelId) => {
    return index_1.db
        .selectFrom('aggregator_sources')
        .selectAll()
        .where('platform', '=', 'discord')
        .where('server_id', '=', serverId)
        .where('channel_id', '=', channelId)
        .executeTakeFirst();
};
exports.getAggregatorSourceByDiscordChannel = getAggregatorSourceByDiscordChannel;
const createAggregatorSource = async (input) => {
    return index_1.db
        .insertInto('aggregator_sources')
        .values({
        name: input.name,
        platform: input.platform ?? 'discord',
        server_id: input.serverId,
        channel_id: input.channelId,
        enabled: input.enabled ?? true,
        allow_paid: input.allowPaid ?? false,
        publish_mode: input.publishMode ?? 'manual_review',
        default_timezone: input.defaultTimezone ?? 'America/Sao_Paulo',
        notes: input.notes ?? null,
    })
        .returningAll()
        .executeTakeFirstOrThrow();
};
exports.createAggregatorSource = createAggregatorSource;
const updateAggregatorSource = async (sourceId, input) => {
    const payload = {
        updated_at: (0, kysely_1.sql) `now()`,
    };
    if (input.name !== undefined)
        payload.name = input.name;
    if (input.serverId !== undefined)
        payload.server_id = input.serverId;
    if (input.channelId !== undefined)
        payload.channel_id = input.channelId;
    if (input.enabled !== undefined)
        payload.enabled = input.enabled;
    if (input.allowPaid !== undefined)
        payload.allow_paid = input.allowPaid;
    if (input.publishMode !== undefined)
        payload.publish_mode = input.publishMode;
    if (input.defaultTimezone !== undefined)
        payload.default_timezone = input.defaultTimezone;
    if (input.notes !== undefined)
        payload.notes = input.notes;
    return index_1.db
        .updateTable('aggregator_sources')
        .set(payload)
        .where('id', '=', sourceId)
        .returningAll()
        .executeTakeFirst();
};
exports.updateAggregatorSource = updateAggregatorSource;
const setAggregatorSourceEnabled = async (sourceId, enabled) => {
    return index_1.db
        .updateTable('aggregator_sources')
        .set({
        enabled,
        updated_at: (0, kysely_1.sql) `now()`,
    })
        .where('id', '=', sourceId)
        .returningAll()
        .executeTakeFirst();
};
exports.setAggregatorSourceEnabled = setAggregatorSourceEnabled;
const upsertAggregatorRawMessage = async (input) => {
    return index_1.db
        .insertInto('aggregator_imported_raw_messages')
        .values({
        source_id: input.sourceId,
        external_id: input.externalId,
        raw_text: input.rawText,
        author_name: input.authorName ?? null,
        author_discord_id: input.authorDiscordId ?? null,
        message_url: input.messageUrl ?? null,
        message_created_at: input.messageCreatedAt ?? null,
        raw_payload: input.rawPayload,
        processed: false,
        processing_attempts: 0,
        last_processing_error: null,
    })
        .onConflict((oc) => oc.columns(['source_id', 'external_id']).doUpdateSet({
        raw_text: input.rawText,
        author_name: input.authorName ?? null,
        author_discord_id: input.authorDiscordId ?? null,
        message_url: input.messageUrl ?? null,
        message_created_at: input.messageCreatedAt ?? null,
        raw_payload: input.rawPayload,
        updated_at: (0, kysely_1.sql) `now()`,
    }))
        .returningAll()
        .executeTakeFirstOrThrow();
};
exports.upsertAggregatorRawMessage = upsertAggregatorRawMessage;
const markAggregatorRawMessageProcessed = async (rawMessageId, params) => {
    return index_1.db
        .updateTable('aggregator_imported_raw_messages')
        .set({
        processed: params.processed,
        last_processing_error: params.errorMessage ?? null,
        processing_attempts: (0, kysely_1.sql) `processing_attempts + 1`,
        updated_at: (0, kysely_1.sql) `now()`,
    })
        .where('id', '=', rawMessageId)
        .returningAll()
        .executeTakeFirst();
};
exports.markAggregatorRawMessageProcessed = markAggregatorRawMessageProcessed;
const upsertAggregatorCandidate = async (input) => {
    return index_1.db
        .insertInto('aggregator_import_candidates')
        .values({
        source_id: input.sourceId,
        raw_message_id: input.rawMessageId,
        external_id: input.externalId,
        parsed_json: input.parsedJson,
        confidence_score: input.confidenceScore,
        editorial_status: input.editorialStatus,
        publish_mode: input.publishMode,
        publish_at: input.publishAt ?? null,
        rejection_reason: input.rejectionReason ?? null,
        published_table_id: input.publishedTableId ?? null,
    })
        .onConflict((oc) => oc.columns(['source_id', 'external_id']).doUpdateSet({
        raw_message_id: input.rawMessageId,
        parsed_json: input.parsedJson,
        confidence_score: input.confidenceScore,
        editorial_status: input.editorialStatus,
        publish_mode: input.publishMode,
        publish_at: input.publishAt ?? null,
        rejection_reason: input.rejectionReason ?? null,
        published_table_id: input.publishedTableId ?? null,
        updated_at: (0, kysely_1.sql) `now()`,
    }))
        .returningAll()
        .executeTakeFirstOrThrow();
};
exports.upsertAggregatorCandidate = upsertAggregatorCandidate;
const listAggregatorCandidates = async (filters) => {
    const page = Math.max(1, filters.page);
    const limit = Math.min(100, Math.max(1, filters.limit));
    const offset = (page - 1) * limit;
    let query = index_1.db
        .selectFrom('aggregator_import_candidates as c')
        .leftJoin('aggregator_sources as s', 's.id', 'c.source_id')
        .leftJoin('aggregator_imported_raw_messages as r', 'r.id', 'c.raw_message_id')
        .select([
        'c.id',
        'c.source_id',
        'c.raw_message_id',
        'c.external_id',
        'c.parsed_json',
        'c.confidence_score',
        'c.editorial_status',
        'c.publish_mode',
        'c.publish_at',
        'c.rejection_reason',
        'c.published_table_id',
        'c.created_at',
        'c.updated_at',
        's.name as source_name',
        's.platform as source_platform',
        'r.author_name as author_name',
        'r.message_url as message_url',
        'r.message_created_at as message_created_at',
    ]);
    let countQuery = index_1.db
        .selectFrom('aggregator_import_candidates as c')
        .select((eb) => eb.fn.countAll().as('total'));
    if (filters.editorialStatus) {
        query = query.where('c.editorial_status', '=', filters.editorialStatus);
        countQuery = countQuery.where('c.editorial_status', '=', filters.editorialStatus);
    }
    const [items, totalRow] = await Promise.all([
        query.orderBy('c.created_at', 'desc').limit(limit).offset(offset).execute(),
        countQuery.executeTakeFirst(),
    ]);
    const total = Number(totalRow?.total ?? 0);
    return {
        items,
        pagination: {
            page,
            limit,
            total,
            hasMore: offset + items.length < total,
        },
    };
};
exports.listAggregatorCandidates = listAggregatorCandidates;
const getAggregatorCandidateById = async (candidateId) => {
    return index_1.db
        .selectFrom('aggregator_import_candidates as c')
        .leftJoin('aggregator_sources as s', 's.id', 'c.source_id')
        .leftJoin('aggregator_imported_raw_messages as r', 'r.id', 'c.raw_message_id')
        .select([
        'c.id',
        'c.source_id',
        'c.raw_message_id',
        'c.external_id',
        'c.parsed_json',
        'c.confidence_score',
        'c.editorial_status',
        'c.publish_mode',
        'c.publish_at',
        'c.rejection_reason',
        'c.published_table_id',
        'c.created_at',
        'c.updated_at',
        's.name as source_name',
        's.platform as source_platform',
        's.server_id as source_server_id',
        's.channel_id as source_channel_id',
        'r.raw_text as raw_text',
        'r.author_name as author_name',
        'r.author_discord_id as author_discord_id',
        'r.message_url as message_url',
        'r.message_created_at as message_created_at',
    ])
        .where('c.id', '=', candidateId)
        .executeTakeFirst();
};
exports.getAggregatorCandidateById = getAggregatorCandidateById;
const updateAggregatorCandidateEditorialStatus = async (candidateId, payload) => {
    return index_1.db
        .updateTable('aggregator_import_candidates')
        .set({
        editorial_status: payload.editorialStatus,
        rejection_reason: payload.rejectionReason ?? null,
        publish_at: payload.publishAt ?? null,
        published_table_id: payload.publishedTableId ?? null,
        updated_at: (0, kysely_1.sql) `now()`,
    })
        .where('id', '=', candidateId)
        .returningAll()
        .executeTakeFirst();
};
exports.updateAggregatorCandidateEditorialStatus = updateAggregatorCandidateEditorialStatus;
const listAcceptedAggregatorCandidatesByDate = async (date) => {
    return index_1.db
        .selectFrom('aggregator_import_candidates as c')
        .leftJoin('aggregator_sources as s', 's.id', 'c.source_id')
        .leftJoin('aggregator_imported_raw_messages as r', 'r.id', 'c.raw_message_id')
        .select([
        'c.id',
        'c.external_id',
        'c.parsed_json',
        'c.created_at',
        'r.message_created_at as message_created_at',
        's.name as source_name',
    ])
        .where('c.editorial_status', '=', 'accepted')
        .where((0, kysely_1.sql) `DATE(COALESCE(r.message_created_at, c.created_at) AT TIME ZONE 'America/Sao_Paulo') = ${date}`)
        .orderBy((0, kysely_1.sql) `COALESCE(r.message_created_at, c.created_at)`, 'asc')
        .execute();
};
exports.listAcceptedAggregatorCandidatesByDate = listAcceptedAggregatorCandidatesByDate;
