"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDiscordExporterJson = exports.sanitizeDiscordExporterJson = void 0;
const jsonrepair_1 = require("jsonrepair");
/**
 * Tenta corrigir JSONs malformados comuns do DiscordChatExporter usando jsonrepair
 */
const sanitizeDiscordExporterJson = (rawJson) => {
    try {
        return (0, jsonrepair_1.jsonrepair)(rawJson);
    }
    catch (error) {
        // Se jsonrepair falhar, retornar o original
        return rawJson;
    }
};
exports.sanitizeDiscordExporterJson = sanitizeDiscordExporterJson;
/**
 * Tenta fazer parse de um JSON, aplicando sanitização se necessário
 */
const parseDiscordExporterJson = (rawJson) => {
    // Primeira tentativa: parse direto
    try {
        return JSON.parse(rawJson);
    }
    catch (firstError) {
        // Segunda tentativa: com jsonrepair
        try {
            const repaired = (0, exports.sanitizeDiscordExporterJson)(rawJson);
            return JSON.parse(repaired);
        }
        catch (secondError) {
            // Se ainda falhar, lançar o erro original com contexto
            throw new Error(`Falha ao fazer parse do JSON do DiscordChatExporter. ` +
                `Erro original: ${firstError.message}. ` +
                `Tentativa de correção também falhou: ${secondError.message}`);
        }
    }
};
exports.parseDiscordExporterJson = parseDiscordExporterJson;
