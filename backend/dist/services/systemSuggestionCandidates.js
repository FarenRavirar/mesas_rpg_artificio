"use strict";
// Helper puro e testavel para resolucao de sugestoes de sistemas (Spec 018).
// Normaliza nomes de sistemas e pontua candidatos do catalogo para evitar
// redundancia (alias/edicao/duplicata) antes de criar um sistema novo.
//
// Sem dependencias externas: comparacao local por igualdade normalizada,
// match de base + token de edicao e similaridade Levenshtein.
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSystemName = normalizeSystemName;
exports.scoreSystemCandidates = scoreSystemCandidates;
const EDITION_WORDS = new Set([
    'revised',
    'remaster',
    'remastered',
    'edition',
    'edicao',
    'ed',
    'anniversary',
    'aniversario',
    'versao',
    'version',
]);
const GENERIC_SUFFIX = new Set(['rpg', 'ttrpg']);
function stripAccents(value) {
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function isEditionToken(token) {
    return (/^(?:19|20)\d{2}$/.test(token) || // ano: 2024
        /^\d{1,2}e$/.test(token) || // edicao em ingles: 5e, 2e
        /^\d{1,2}a$/.test(token) || // ordinal PT apos remover acento: 5a (de 5ª)
        /^\d+\.\d+$/.test(token) || // versao pontuada: 1.3
        /^v\d+(?:\.\d+)?$/.test(token) // v2, v2.1
    );
}
function normalizeSystemName(raw) {
    const original = typeof raw === 'string' ? raw : '';
    const cleaned = stripAccents(original)
        .toLowerCase()
        .replace(/ª/g, 'a')
        .replace(/º/g, 'o')
        .replace(/[™®©]/g, ' ') // TM, R, C
        .replace(/\((?:tm|r|c)\)/g, ' ')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9.\s-]/g, ' ') // mantem ponto (versoes) e hifen
        .replace(/\b(?:tm|registered)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    const normalized = cleaned;
    const tokens = normalized.split(/[\s-]+/).filter(Boolean);
    const editionTokens = [];
    const baseTokens = [];
    for (const token of tokens) {
        if (isEditionToken(token)) {
            editionTokens.push(token);
        }
        else if (EDITION_WORDS.has(token)) {
            // palavra de edicao: descartada da base, nao vira token util
        }
        else {
            baseTokens.push(token);
        }
    }
    while (baseTokens.length > 1 && GENERIC_SUFFIX.has(baseTokens[baseTokens.length - 1])) {
        baseTokens.pop();
    }
    const base = baseTokens.join(' ').trim();
    const slug = base.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return { raw: original, normalized, base, editionTokens, slug };
}
function levenshtein(a, b) {
    if (a === b)
        return 0;
    if (a.length === 0)
        return b.length;
    if (b.length === 0)
        return a.length;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    let curr = new Array(b.length + 1);
    for (let i = 1; i <= a.length; i += 1) {
        curr[0] = i;
        for (let j = 1; j <= b.length; j += 1) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
        }
        [prev, curr] = [curr, prev];
    }
    return prev[b.length];
}
function similarity(a, b) {
    if (!a && !b)
        return 1;
    const max = Math.max(a.length, b.length);
    if (max === 0)
        return 1;
    return 1 - levenshtein(a, b) / max;
}
const round2 = (value) => Math.round(value * 100) / 100;
function scoreOne(suggestion, system, aliasesNormalized) {
    const fields = [];
    fields.push({ value: normalizeSystemName(system.name), reason: 'name_exact', weight: 1.0 });
    if (system.name_pt) {
        fields.push({ value: normalizeSystemName(system.name_pt), reason: 'name_pt_exact', weight: 1.0 });
    }
    for (const alias of aliasesNormalized) {
        fields.push({ value: alias, reason: 'alias_exact', weight: 0.98 });
    }
    let best = null;
    const consider = (candidate) => {
        if (!best || candidate.score > best.score)
            best = candidate;
    };
    for (const field of fields) {
        // 1. Igualdade normalizada completa.
        if (suggestion.normalized && suggestion.normalized === field.value.normalized) {
            consider({ score: field.weight, reasons: [field.reason] });
            continue;
        }
        // 2. Mesma base.
        if (suggestion.base && suggestion.base === field.value.base) {
            if (suggestion.editionTokens.length > 0) {
                consider({ score: 0.85, reasons: ['base_plus_edition'] });
            }
            else {
                consider({ score: 0.9, reasons: ['base_match'] });
            }
            continue;
        }
        // 3. Similaridade aproximada da base.
        if (suggestion.base && field.value.base) {
            const ratio = similarity(suggestion.base, field.value.base);
            if (ratio >= 0.82) {
                consider({ score: round2(Math.min(ratio, 0.8)), reasons: ['fuzzy_similar'] });
            }
        }
    }
    return best;
}
/**
 * Pontua os candidatos do catalogo contra o nome sugerido. Funcao pura:
 * recebe os arrays do catalogo ja carregados e nao toca em banco.
 */
function scoreSystemCandidates(suggestionName, systems, aliases, limit = 5) {
    const suggestion = normalizeSystemName(suggestionName);
    const aliasesBySystem = new Map();
    for (const alias of aliases) {
        const list = aliasesBySystem.get(alias.system_id) ?? [];
        list.push(normalizeSystemName(alias.alias));
        aliasesBySystem.set(alias.system_id, list);
    }
    const scored = [];
    for (const system of systems) {
        const match = scoreOne(suggestion, system, aliasesBySystem.get(system.id) ?? []);
        if (match && match.score >= 0.5) {
            scored.push({
                system_id: system.id,
                name: system.name,
                path_slug: system.path_slug,
                node_type: system.node_type,
                score: round2(match.score),
                reasons: match.reasons,
            });
        }
    }
    scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    const candidates = scored.slice(0, Math.max(0, limit));
    const best = candidates[0];
    let recommended_action;
    if (!best) {
        recommended_action = 'create_system';
    }
    else if (best.score >= 0.97) {
        recommended_action = 'merge_existing';
    }
    else if (best.score >= 0.7) {
        recommended_action = 'create_alias';
    }
    else {
        recommended_action = 'create_system';
    }
    return { candidates, recommended_action };
}
