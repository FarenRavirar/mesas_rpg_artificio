"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../db");
const normalizeExporterPayload_1 = require("../domain/aggregator/normalizeExporterPayload");
const importFromExporterService_1 = require("../services/aggregator/importFromExporterService");
const exportService_1 = require("../services/aggregator/exportService");
const resolveInputFile = () => {
    const args = process.argv.slice(2);
    const explicit = args.find((arg) => !arg.startsWith('--'));
    if (explicit)
        return path_1.default.resolve(explicit);
    return path_1.default.resolve(__dirname, '../../../export_exemple.json');
};
const parseFlags = () => ({
    dryRun: process.argv.includes('--dry-run'),
    sourceId: (process.argv.find((arg) => arg.startsWith('--source-id=')) ?? '').replace('--source-id=', '') || undefined,
    date: (process.argv.find((arg) => arg.startsWith('--date=')) ?? '').replace('--date=', '') || undefined,
    exportOnly: process.argv.includes('--export-only'),
});
/**
 * O DiscordChatExporter pode gerar exports truncados quando a exportação é interrompida.
 * Padrão mais comum (E088): o array `messages` fecha com `]` mas o objeto raiz nunca fecha com `}`.
 * Também pode haver trailing comma na última mensagem: `},\n    ]`.
 *
 * Esta função tenta detectar e reparar automaticamente esses casos antes do JSON.parse,
 * emitindo aviso ao operador quando o reparo for aplicado.
 */
const repairTruncatedJson = (raw) => {
    const trimmed = raw.trimEnd();
    // Tenta parse direto — se funcionar, não há truncamento
    try {
        JSON.parse(trimmed);
        return { content: trimmed, repaired: false };
    }
    catch {
        // Remove trailing comma antes do fechamento do array: `,\n  ]` ou `,\n]`
        let content = trimmed.replace(/,(\s*)\](\s*)$/, '$1]$2');
        // Remove trailing comma dentro de objetos seguida do fechamento: `},\n    ]`
        content = content.replace(/\},(\s*)\](\s*)$/, '}$1]$2');
        // Fecha o objeto raiz se o conteúdo terminar em `]` sem `}`
        if (content.trimEnd().endsWith(']')) {
            content = `${content.trimEnd()}\n}`;
        }
        try {
            JSON.parse(content);
            return { content, repaired: true };
        }
        catch {
            // Não conseguiu reparar — retorna original para gerar erro descritivo
            return { content: raw, repaired: false };
        }
    }
};
const run = async () => {
    const flags = parseFlags();
    if (flags.exportOnly) {
        const result = await exportService_1.exportService.getDailyAccepted(flags.date);
        console.log(result.text);
        await db_1.db.destroy();
        return;
    }
    const filePath = resolveInputFile();
    if (!fs_1.default.existsSync(filePath)) {
        console.error(`[aggregator:import] Arquivo não encontrado: ${filePath}`);
        await db_1.db.destroy();
        process.exit(1);
    }
    let rawJson;
    try {
        const rawText = fs_1.default.readFileSync(filePath, 'utf8');
        const { content, repaired } = repairTruncatedJson(rawText);
        if (repaired) {
            console.warn('[aggregator:import] ⚠️  JSON truncado detectado e reparado automaticamente (E088).');
            console.warn('[aggregator:import]    O arquivo de export estava incompleto — verifique se a exportação foi concluída.');
        }
        rawJson = JSON.parse(content);
    }
    catch {
        console.error(`[aggregator:import] Falha ao parsear JSON do arquivo: ${filePath}`);
        console.error('[aggregator:import] O reparo automático não foi suficiente. Verifique o arquivo manualmente (E088).');
        await db_1.db.destroy();
        process.exit(1);
    }
    // Valida estrutura antes de enviar ao serviço
    try {
        await (0, normalizeExporterPayload_1.normalizeExporterPayload)(rawJson);
    }
    catch (err) {
        console.error(`[aggregator:import] Payload inválido: ${err?.message ?? err}`);
        await db_1.db.destroy();
        process.exit(1);
    }
    console.log(`[aggregator:import] Iniciando importação: ${filePath}`);
    if (flags.dryRun)
        console.log('[aggregator:import] Modo dry-run ativado — nenhum dado será persistido.');
    if (flags.sourceId)
        console.log(`[aggregator:import] Source ID forçada: ${flags.sourceId}`);
    const summary = await importFromExporterService_1.importFromExporterService.importPayload({
        payload: rawJson,
        sourceId: flags.sourceId,
        dryRun: flags.dryRun,
    });
    console.log('\n[aggregator:import] Resultado:');
    console.log(`- Total de mensagens no arquivo : ${summary.totalMessages}`);
    console.log(`- Mensagens processadas         : ${summary.imported}`);
    console.log(`- Aceitas                        : ${summary.accepted}`);
    console.log(`- Aguardando revisão             : ${summary.awaitingReview}`);
    console.log(`- Rejeitadas                     : ${summary.rejected}`);
    console.log(`- Falhas de processamento        : ${summary.failed}`);
    console.log(`- Dry-run                        : ${summary.dryRun}`);
    if (summary.failed > 0) {
        console.log('\n[aggregator:import] Mensagens com falha:');
        for (const result of summary.results.filter((r) => r.editorialStatus === 'failed')) {
            console.log(`  - messageId: ${result.messageId} | ${result.reason ?? 'sem detalhe'}`);
        }
    }
    await db_1.db.destroy();
};
run().catch(async (error) => {
    console.error('[aggregator:import] Falha fatal:', error);
    await db_1.db.destroy();
    process.exit(1);
});
