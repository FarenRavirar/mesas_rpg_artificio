import { sql } from 'kysely';
import { db } from './index';
import type {
  AggregatorEditorialStatus,
  AggregatorPlatform,
  AggregatorPublishMode,
} from './types';

export interface CreateAggregatorSourceInput {
  name: string;
  platform?: AggregatorPlatform;
  serverId: string;
  channelId: string;
  enabled?: boolean;
  allowPaid?: boolean;
  publishMode?: AggregatorPublishMode;
  defaultTimezone?: string;
  notes?: string | null;
}

export interface UpdateAggregatorSourceInput {
  name?: string;
  serverId?: string;
  channelId?: string;
  enabled?: boolean;
  allowPaid?: boolean;
  publishMode?: AggregatorPublishMode;
  defaultTimezone?: string;
  notes?: string | null;
}

export interface UpsertAggregatorRawMessageInput {
  sourceId: string;
  externalId: string;
  rawText: string;
  authorName?: string | null;
  authorDiscordId?: string | null;
  messageUrl?: string | null;
  messageCreatedAt?: Date | null;
  rawPayload: unknown;
}

export interface UpsertAggregatorCandidateInput {
  sourceId: string;
  rawMessageId: string;
  externalId: string;
  parsedJson: unknown;
  confidenceScore: number;
  editorialStatus: AggregatorEditorialStatus;
  publishMode: AggregatorPublishMode;
  publishAt?: Date | null;
  rejectionReason?: string | null;
  publishedTableId?: string | null;
}

export interface ListAggregatorCandidatesFilters {
  editorialStatus?: AggregatorEditorialStatus;
  page: number;
  limit: number;
}

export const listAggregatorSources = async () => {
  return db
    .selectFrom('aggregator_sources')
    .selectAll()
    .orderBy('created_at', 'desc')
    .execute();
};

export const getAggregatorSourceById = async (sourceId: string) => {
  return db
    .selectFrom('aggregator_sources')
    .selectAll()
    .where('id', '=', sourceId)
    .executeTakeFirst();
};

export const getAggregatorSourceByDiscordChannel = async (serverId: string, channelId: string) => {
  return db
    .selectFrom('aggregator_sources')
    .selectAll()
    .where('platform', '=', 'discord')
    .where('server_id', '=', serverId)
    .where('channel_id', '=', channelId)
    .executeTakeFirst();
};

export const createAggregatorSource = async (input: CreateAggregatorSourceInput) => {
  return db
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

export const updateAggregatorSource = async (sourceId: string, input: UpdateAggregatorSourceInput) => {
  const payload: Record<string, unknown> = {
    updated_at: sql<Date>`now()`,
  };

  if (input.name !== undefined) payload.name = input.name;
  if (input.serverId !== undefined) payload.server_id = input.serverId;
  if (input.channelId !== undefined) payload.channel_id = input.channelId;
  if (input.enabled !== undefined) payload.enabled = input.enabled;
  if (input.allowPaid !== undefined) payload.allow_paid = input.allowPaid;
  if (input.publishMode !== undefined) payload.publish_mode = input.publishMode;
  if (input.defaultTimezone !== undefined) payload.default_timezone = input.defaultTimezone;
  if (input.notes !== undefined) payload.notes = input.notes;

  return db
    .updateTable('aggregator_sources')
    .set(payload)
    .where('id', '=', sourceId)
    .returningAll()
    .executeTakeFirst();
};

export const setAggregatorSourceEnabled = async (sourceId: string, enabled: boolean) => {
  return db
    .updateTable('aggregator_sources')
    .set({
      enabled,
      updated_at: sql<Date>`now()`,
    })
    .where('id', '=', sourceId)
    .returningAll()
    .executeTakeFirst();
};

export const upsertAggregatorRawMessage = async (input: UpsertAggregatorRawMessageInput) => {
  return db
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
    .onConflict((oc) =>
      oc.columns(['source_id', 'external_id']).doUpdateSet({
        raw_text: input.rawText,
        author_name: input.authorName ?? null,
        author_discord_id: input.authorDiscordId ?? null,
        message_url: input.messageUrl ?? null,
        message_created_at: input.messageCreatedAt ?? null,
        raw_payload: input.rawPayload,
        updated_at: sql<Date>`now()`,
      })
    )
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const markAggregatorRawMessageProcessed = async (
  rawMessageId: string,
  params: { processed: boolean; errorMessage?: string | null }
) => {
  return db
    .updateTable('aggregator_imported_raw_messages')
    .set({
      processed: params.processed,
      last_processing_error: params.errorMessage ?? null,
      processing_attempts: sql<number>`processing_attempts + 1`,
      updated_at: sql<Date>`now()`,
    })
    .where('id', '=', rawMessageId)
    .returningAll()
    .executeTakeFirst();
};

export const upsertAggregatorCandidate = async (input: UpsertAggregatorCandidateInput) => {
  return db
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
    .onConflict((oc) =>
      oc.columns(['source_id', 'external_id']).doUpdateSet({
        raw_message_id: input.rawMessageId,
        parsed_json: input.parsedJson,
        confidence_score: input.confidenceScore,
        editorial_status: input.editorialStatus,
        publish_mode: input.publishMode,
        publish_at: input.publishAt ?? null,
        rejection_reason: input.rejectionReason ?? null,
        published_table_id: input.publishedTableId ?? null,
        updated_at: sql<Date>`now()`,
      })
    )
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const listAggregatorCandidates = async (filters: ListAggregatorCandidatesFilters) => {
  const page = Math.max(1, filters.page);
  const limit = Math.min(100, Math.max(1, filters.limit));
  const offset = (page - 1) * limit;

  let query = db
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

  let countQuery = db
    .selectFrom('aggregator_import_candidates as c')
    .select((eb) => eb.fn.countAll<string>().as('total'));

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

export const getAggregatorCandidateById = async (candidateId: string) => {
  return db
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

export const updateAggregatorCandidateEditorialStatus = async (
  candidateId: string,
  payload: {
    editorialStatus: AggregatorEditorialStatus;
    rejectionReason?: string | null;
    publishAt?: Date | null;
    publishedTableId?: string | null;
  }
) => {
  return db
    .updateTable('aggregator_import_candidates')
    .set({
      editorial_status: payload.editorialStatus,
      rejection_reason: payload.rejectionReason ?? null,
      publish_at: payload.publishAt ?? null,
      published_table_id: payload.publishedTableId ?? null,
      updated_at: sql<Date>`now()`,
    })
    .where('id', '=', candidateId)
    .returningAll()
    .executeTakeFirst();
};

export const listAcceptedAggregatorCandidatesByDate = async (date: string) => {
  return db
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
    .where(sql<boolean>`DATE(COALESCE(r.message_created_at, c.created_at) AT TIME ZONE 'America/Sao_Paulo') = ${date}`)
    .orderBy(sql`COALESCE(r.message_created_at, c.created_at)`, 'asc')
    .execute();
};
