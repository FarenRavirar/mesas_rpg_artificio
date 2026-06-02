"use strict";
/**
 * Logica pura da mescla de feedback de desenvolvimento (Spec 024).
 *
 * Integra TODAS as infos dos secundarios no destino: une console/network errors
 * (com dedup e cap) e acumula um snapshot completo de cada secundario em
 * `merged_sources` (titulo, descricao, contato/e-mail, screenshot, rota, etc.),
 * util para investigacao e retorno futuro. Funcao pura/testavel; a persistencia
 * e a transacao ficam na rota.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_MERGED_ERRORS = exports.MAX_MERGE_SOURCES = void 0;
exports.buildMerge = buildMerge;
exports.MAX_MERGE_SOURCES = 50;
exports.MAX_MERGED_ERRORS = 100;
function toArray(value) {
    return Array.isArray(value) ? value : [];
}
function unionDedup(...lists) {
    const seen = new Set();
    const out = [];
    for (const list of lists) {
        for (const item of list) {
            let key;
            try {
                key = JSON.stringify(item);
            }
            catch {
                key = String(item);
            }
            if (seen.has(key))
                continue;
            seen.add(key);
            out.push(item);
            if (out.length >= exports.MAX_MERGED_ERRORS)
                return out;
        }
    }
    return out;
}
function snapshot(source) {
    return {
        id: source.id,
        kind: source.kind,
        title: source.title,
        description: source.description,
        contact_email: source.contact_email,
        screenshot_url: source.screenshot_url,
        page_url: source.page_url,
        route_path: source.route_path,
        environment: source.environment,
        created_at: source.created_at instanceof Date ? source.created_at.toISOString() : source.created_at,
        console_errors: toArray(source.console_errors),
        network_errors: toArray(source.network_errors),
        merged_at: new Date().toISOString(),
    };
}
function buildMerge(primary, sources) {
    const console_errors = unionDedup(toArray(primary.console_errors), ...sources.map((s) => toArray(s.console_errors)));
    const network_errors = unionDedup(toArray(primary.network_errors), ...sources.map((s) => toArray(s.network_errors)));
    const merged_sources = [
        ...toArray(primary.merged_sources),
        ...sources.map((s) => snapshot(s)),
    ];
    return { console_errors, network_errors, merged_sources };
}
