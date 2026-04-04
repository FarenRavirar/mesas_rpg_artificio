import fs from 'fs';
import path from 'path';

import { db } from '../db';
import { normalizeExporterPayload } from '../domain/aggregator/normalizeExporterPayload';
import { importFromExporterService } from '../services/aggregator/importFromExporterService';
import { exportService } from '../services/aggregator/exportService';

const resolveInputFile = (): string => {
  const args = process.argv.slice(2);
  const explicit = args.find((arg) => !arg.startsWith('--'));
  if (explicit) return path.resolve(explicit);
  return path.resolve(__dirname, '../../../export_exemple.json');
};

const parseFlags = () => ({
  dryRun: process.argv.includes('--dry-run'),
  sourceId: (process.argv.find((arg) => arg.startsWith('--source-id=')) ?? '').replace('--source-id=', '') || undefined,
  date: (process.argv.find((arg) => arg.startsWith('--date=')) ?? '').replace('--date=', '') || undefined,
  exportOnly: process.argv.includes('--export-only'),
});

const run = async () => {
  const flags = parseFlags();

  if (flags.exportOnly) {
    const result = await exportService.getDailyAccepted(flags.date);
    console.log(result.text);
    await db.destroy();
    return;
  }

  const filePath = resolveInputFile();

  if (!fs.existsSync(filePath)) {
    console.error(`[aggregator:import] Arquivo não encontrado: ${filePath}`);
    await db.destroy();
    process.exit(1);
  }

  let rawJson: unknown;
  try {
    rawJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    console.error(`[aggregator:import] Falha ao parsear JSON do arquivo: ${filePath}`);
    await db.destroy();
    process.exit(1);
  }

  // Valida superficialmente antes de enviar ao serviço
  try {
    normalizeExporterPayload(rawJson);
  } catch (err: any) {
    console.error(`[aggregator:import] Payload inválido: ${err?.message ?? err}`);
    await db.destroy();
    process.exit(1);
  }

  console.log(`[aggregator:import] Iniciando importação: ${filePath}`);
  if (flags.dryRun) console.log('[aggregator:import] Modo dry-run ativado — nenhum dado será persistido.');
  if (flags.sourceId) console.log(`[aggregator:import] Source ID forçada: ${flags.sourceId}`);

  const summary = await importFromExporterService.importPayload({
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

  await db.destroy();
};

run().catch(async (error) => {
  console.error('[aggregator:import] Falha fatal:', error);
  await db.destroy();
  process.exit(1);
});
