import {
  markAggregatorRawMessageProcessed,
  upsertAggregatorCandidate,
  upsertAggregatorRawMessage,
} from '../../db/aggregator';
import { db } from '../../db';
import { normalizeCandidate } from '../../domain/aggregator/normalizeCandidate';
import { parseExporterMessage } from '../../domain/aggregator/parseExporterMessage';
import { normalizeSystemAlias } from '../../domain/aggregator/classifySystem';
import type {
  KnownSystemAlias,
  NormalizedExporterPayload,
  ParsedMessageDraft,
} from '../../domain/aggregator/types';
import type { AggregatorEditorialStatus, AggregatorPublishMode } from '../../db/types';
import { publishService } from './publishService';

export interface AggregatorSourcePolicy {
  id: string;
  allow_paid: boolean;
  publish_mode: AggregatorPublishMode;
  server_id: string;
  channel_id: string;
}

export interface ImportMessageResult {
  messageId: string;
  editorialStatus: AggregatorEditorialStatus | 'failed';
  confidenceScore: number | null;
  reason: string | null;
}

export interface ImportSummary {
  totalMessages: number;
  imported: number;
  accepted: number;
  awaitingReview: number;
  rejected: number;
  failed: number;
  dryRun: boolean;
  results: ImportMessageResult[];
}

interface ImportNormalizedPayloadInput {
  payload: NormalizedExporterPayload;
  source: AggregatorSourcePolicy;
  dryRun: boolean;
}

const toDateOrNull = (value: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'Falha não mapeada durante o processamento da mensagem.';
};

const buildMessageUrl = (guildId: string | null, channelId: string | null, messageId: string): string | null => {
  if (!guildId || !channelId) return null;
  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
};

const buildSummary = (payload: NormalizedExporterPayload, dryRun: boolean): ImportSummary => ({
  totalMessages: payload.messages.length,
  imported: 0,
  accepted: 0,
  awaitingReview: 0,
  rejected: 0,
  failed: 0,
  dryRun,
  results: [],
});

const loadKnownAliases = async (): Promise<KnownSystemAlias[]> => {
  const rows = await db
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
      aliasNormalized: normalizeSystemAlias(row.alias),
    }))
    .filter((row) => row.aliasNormalized.length > 0);
};

const parseAndNormalizeMessage = (
  payload: NormalizedExporterPayload,
  source: AggregatorSourcePolicy,
  message: NormalizedExporterPayload['messages'][number],
  knownSystemAliases: KnownSystemAlias[]
): {
  draft: ParsedMessageDraft;
  normalized: ReturnType<typeof normalizeCandidate>;
  publishAt: Date | null;
} => {
  const draft = parseExporterMessage({
    message,
    sourceChannelId: payload.channelId ?? source.channel_id,
    knownSystemAliases,
  });

  const normalized = normalizeCandidate({
    draft,
    allowPaid: source.allow_paid,
    publishMode: source.publish_mode,
  });

  const publishAt = publishService.resolvePublishAt(normalized.editorialStatus, normalized.publishMode);

  return { draft, normalized, publishAt };
};

export const rawImportService = {
  async importNormalizedPayload(input: ImportNormalizedPayloadInput): Promise<ImportSummary> {
    const summary = buildSummary(input.payload, input.dryRun);
    const knownSystemAliases = await loadKnownAliases();

    for (const message of input.payload.messages) {
      let rawMessageId: string | null = null;

      try {
        if (!input.dryRun) {
          const rawRecord = await upsertAggregatorRawMessage({
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

        const { normalized, publishAt } = parseAndNormalizeMessage(
          input.payload,
          input.source,
          message,
          knownSystemAliases
        );

        if (!input.dryRun && rawMessageId) {
          await upsertAggregatorCandidate({
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

          await markAggregatorRawMessageProcessed(rawMessageId, {
            processed: true,
            errorMessage: null,
          });
        }

        summary.imported += 1;
        if (normalized.editorialStatus === 'accepted') summary.accepted += 1;
        if (normalized.editorialStatus === 'awaiting_review') summary.awaitingReview += 1;
        if (normalized.editorialStatus === 'rejected') summary.rejected += 1;

        summary.results.push({
          messageId: message.id,
          editorialStatus: normalized.editorialStatus,
          confidenceScore: normalized.confidenceScore,
          reason: normalized.rejectionReason,
        });
      } catch (error: unknown) {
        const errorMessage = toErrorMessage(error);

        if (!input.dryRun && rawMessageId) {
          await markAggregatorRawMessageProcessed(rawMessageId, {
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
