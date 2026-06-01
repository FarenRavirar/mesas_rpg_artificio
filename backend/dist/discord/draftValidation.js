"use strict";
// Validações de invariante para drafts do pipeline Discord Sync.
// Espelha em runtime o CHECK CONSTRAINT da migration 118
// (status='ready' => missing_fields=[]) para que a API responda 422 com
// mensagem clara em vez de propagar 23514 do Postgres como 500.
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertDraftReadyTransition = assertDraftReadyTransition;
function asMissingArray(value) {
    if (!Array.isArray(value))
        return null;
    const result = [];
    for (const item of value) {
        if (typeof item === 'string')
            result.push(item);
    }
    return result;
}
function assertDraftReadyTransition(input) {
    if (input.patchStatus !== 'ready') {
        return { allowed: true };
    }
    const fromPatch = asMissingArray(input.patchPayloadMissing);
    const fromCurrent = asMissingArray(input.currentPayloadMissing);
    const effective = fromPatch ?? fromCurrent ?? [];
    if (effective.length === 0) {
        return { allowed: true };
    }
    const preview = effective.slice(0, 5).join(', ');
    const suffix = effective.length > 5 ? '…' : '';
    return {
        allowed: false,
        missingFields: effective,
        reason: `Draft ainda tem ${effective.length} campo(s) faltando (${preview}${suffix}); não pode ser marcado como 'ready'.`,
    };
}
