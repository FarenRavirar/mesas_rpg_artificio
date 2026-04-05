import { normalizeExporterPayload } from '../../domain/aggregator/normalizeExporterPayload';
import { rawImportService, type ImportSummary } from './rawImportService';
import { sourceService } from './sourceService';

export interface ImportFromExporterInput {
  payload: unknown;
  sourceId?: string;
  dryRun?: boolean;
}

const resolveSource = async (sourceId: string | undefined, guildId: string | null, channelId: string | null) => {
  if (sourceId) {
    const source = await sourceService.getById(sourceId);
    if (!source) {
      throw new Error('Source não encontrada para o sourceId informado.');
    }

    return source;
  }

  if (!guildId || !channelId) {
    throw new Error('Não foi possível inferir a source: payload sem guildId/channelId e sourceId ausente.');
  }

  const source = await sourceService.getByDiscordChannel(guildId, channelId);
  if (!source) {
    throw new Error('Nenhuma source cadastrada para o canal Discord informado no payload.');
  }

  return source;
};

export const importFromExporterService = {
  async importPayload(input: ImportFromExporterInput): Promise<ImportSummary> {
    const normalizedPayload = await normalizeExporterPayload(input.payload);

    const source = await resolveSource(input.sourceId, normalizedPayload.guildId, normalizedPayload.channelId);

    return rawImportService.importNormalizedPayload({
      payload: normalizedPayload,
      source: {
        id: source.id,
        allow_paid: source.allow_paid,
        publish_mode: source.publish_mode,
        server_id: source.server_id,
        channel_id: source.channel_id,
      },
      dryRun: input.dryRun === true,
    });
  },
};
