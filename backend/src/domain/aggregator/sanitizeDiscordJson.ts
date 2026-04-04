import { jsonrepair } from 'jsonrepair';

/**
 * Tenta corrigir JSONs malformados comuns do DiscordChatExporter usando jsonrepair
 */
export const sanitizeDiscordExporterJson = (rawJson: string): string => {
  try {
    return jsonrepair(rawJson);
  } catch (error) {
    // Se jsonrepair falhar, retornar o original
    return rawJson;
  }
};

/**
 * Tenta fazer parse de um JSON, aplicando sanitização se necessário
 */
export const parseDiscordExporterJson = (rawJson: string): unknown => {
  // Primeira tentativa: parse direto
  try {
    return JSON.parse(rawJson);
  } catch (firstError) {
    // Segunda tentativa: com jsonrepair
    try {
      const repaired = sanitizeDiscordExporterJson(rawJson);
      return JSON.parse(repaired);
    } catch (secondError) {
      // Se ainda falhar, lançar o erro original com contexto
      throw new Error(
        `Falha ao fazer parse do JSON do DiscordChatExporter. ` +
        `Erro original: ${(firstError as Error).message}. ` +
        `Tentativa de correção também falhou: ${(secondError as Error).message}`
      );
    }
  }
};
