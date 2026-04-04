import {
  getAggregatorCandidateById,
  listAggregatorCandidates,
  updateAggregatorCandidateEditorialStatus,
} from '../../db/aggregator';
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
    return updateAggregatorCandidateEditorialStatus(candidateId, {
      editorialStatus: 'accepted',
      rejectionReason: null,
      publishAt: new Date(),
      publishedTableId: null,
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
