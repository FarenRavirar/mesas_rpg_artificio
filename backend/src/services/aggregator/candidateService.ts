import {
  getAggregatorCandidateById,
  listAggregatorCandidates,
  updateAggregatorCandidateEditorialStatus,
} from '../../db/aggregator';
import { db } from '../../db';
import type { AggregatorEditorialStatus } from '../../db/types';

export interface ListCandidatesInput {
  editorialStatus?: AggregatorEditorialStatus;
  page?: number;
  limit?: number;
}

const sanitizePage = (value: number | undefined): number => {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value as number));
};

const sanitizeLimit = (value: number | undefined): number => {
  if (!Number.isFinite(value)) return 20;
  return Math.min(100, Math.max(1, Math.floor(value as number)));
};

export const candidateService = {
  async list(input: ListCandidatesInput) {
    return listAggregatorCandidates({
      editorialStatus: input.editorialStatus,
      page: sanitizePage(input.page),
      limit: sanitizeLimit(input.limit),
    });
  },

  async getById(candidateId: string) {
    return getAggregatorCandidateById(candidateId);
  },

  async accept(candidateId: string) {
    const candidate = await getAggregatorCandidateById(candidateId);
    if (!candidate) return null;

    const parsedJson = candidate.parsed_json as Record<string, unknown> | null;
    const rawTitle = typeof parsedJson?.title === 'string' ? parsedJson.title.trim() : '';
    const title = rawTitle || 'Anúncio importado';

    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .substring(0, 80);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const newTable = await db
      .insertInto('tables')
      .values({
        slug,
        gm_id: null,
        origin: 'imported',
        source_id: candidate.source_id ?? null,
        title,
        status: 'active',
        type: 'campanha',
        modality: 'online',
        price_type: 'gratuita',
      })
      .returning(['id', 'slug', 'title', 'origin', 'source_id', 'created_at'])
      .executeTakeFirstOrThrow();

    return updateAggregatorCandidateEditorialStatus(candidateId, {
      editorialStatus: 'accepted',
      rejectionReason: null,
      publishAt: new Date(),
      publishedTableId: newTable.id,
    });
  },

  async reject(candidateId: string, rejectionReason: string) {
    return updateAggregatorCandidateEditorialStatus(candidateId, {
      editorialStatus: 'rejected',
      rejectionReason,
      publishAt: null,
      publishedTableId: null,
    });
  },

  async review(candidateId: string, reason?: string | null) {
    return updateAggregatorCandidateEditorialStatus(candidateId, {
      editorialStatus: 'awaiting_review',
      rejectionReason: reason ?? null,
      publishAt: null,
      publishedTableId: null,
    });
  },
};
