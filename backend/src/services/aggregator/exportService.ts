import { listAcceptedAggregatorCandidatesByDate } from '../../db/aggregator';
import { formatForPublication } from '../../domain/aggregator/formatForPublication';
import type { ParsedMessageDraft } from '../../domain/aggregator/types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isParsedMessageDraft = (value: unknown): value is ParsedMessageDraft => {
  if (!value || typeof value !== 'object') return false;

  const sourceMessageId = (value as { sourceMessageId?: unknown }).sourceMessageId;
  return typeof sourceMessageId === 'string' && sourceMessageId.trim().length > 0;
};

const toDateStringInSaoPaulo = (value: Date): string => {
  const formatted = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);

  return formatted;
};

const ensureDate = (date: string | undefined): string => {
  const candidate = date?.trim();

  if (!candidate) {
    return toDateStringInSaoPaulo(new Date());
  }

  if (!DATE_PATTERN.test(candidate)) {
    throw new Error('Data inválida. Use o formato YYYY-MM-DD.');
  }

  return candidate;
};

export const exportService = {
  async getDailyAccepted(dateInput?: string) {
    const date = ensureDate(dateInput);
    const rows = await listAcceptedAggregatorCandidatesByDate(date);

    const items = rows
      .filter((row) => isParsedMessageDraft(row.parsed_json))
      .map((row) => ({
        candidateId: row.id,
        externalId: row.external_id,
        sourceName: row.source_name,
        messageCreatedAt: row.message_created_at,
        parsedJson: row.parsed_json as ParsedMessageDraft,
      }));

    return {
      date,
      total: items.length,
      items,
      text: formatForPublication(items, date),
    };
  },
};
