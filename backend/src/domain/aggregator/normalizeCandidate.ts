import type { AggregatorEditorialStatus, AggregatorPublishMode } from '../../db/types';
import type { ParsedMessageDraft } from './types';

export interface NormalizeCandidateInput {
  draft: ParsedMessageDraft;
  allowPaid: boolean;
  publishMode: AggregatorPublishMode;
}

export interface NormalizeCandidateResult {
  parsedJson: ParsedMessageDraft;
  editorialStatus: AggregatorEditorialStatus;
  publishMode: AggregatorPublishMode;
  confidenceScore: number;
  rejectionReason: string | null;
}

export const normalizeCandidate = (input: NormalizeCandidateInput): NormalizeCandidateResult => {
  const { draft, allowPaid, publishMode } = input;

  if (draft.isPaid && !allowPaid) {
    return {
      parsedJson: {
        ...draft,
        editorialReason: 'Mesa paga bloqueada pela política da source.',
      },
      editorialStatus: 'rejected',
      publishMode,
      confidenceScore: draft.confidenceScore,
      rejectionReason: 'Mesa paga não permitida para esta source.',
    };
  }

  if (draft.isCustomSystem) {
    return {
      parsedJson: {
        ...draft,
        needsReview: true,
        editorialReason: 'Sistema possivelmente custom/homebrew, revisão manual necessária.',
      },
      editorialStatus: 'awaiting_review',
      publishMode,
      confidenceScore: draft.confidenceScore,
      rejectionReason: 'Sistema possivelmente custom/homebrew.',
    };
  }

  if (draft.needsReview || draft.confidenceScore < 0.72) {
    return {
      parsedJson: {
        ...draft,
        needsReview: true,
        editorialReason: draft.editorialReason ?? 'Baixa confiança ou campos essenciais faltando.',
      },
      editorialStatus: 'awaiting_review',
      publishMode,
      confidenceScore: draft.confidenceScore,
      rejectionReason: draft.editorialReason ?? 'Classificação ambígua; requer revisão editorial.',
    };
  }

  return {
    parsedJson: {
      ...draft,
      needsReview: false,
      editorialReason: null,
    },
    editorialStatus: 'accepted',
    publishMode,
    confidenceScore: draft.confidenceScore,
    rejectionReason: null,
  };
};
