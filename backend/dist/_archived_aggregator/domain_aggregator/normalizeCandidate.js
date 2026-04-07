"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCandidate = void 0;
const normalizeCandidate = (input) => {
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
exports.normalizeCandidate = normalizeCandidate;
