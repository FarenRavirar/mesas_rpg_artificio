import {
  createAggregatorSource,
  getAggregatorSourceByDiscordChannel,
  getAggregatorSourceById,
  listAggregatorSources,
  setAggregatorSourceEnabled,
  updateAggregatorSource,
} from '../../db/aggregator';
import type { AggregatorPlatform, AggregatorPublishMode } from '../../db/types';

export interface CreateSourceInput {
  name: string;
  platform?: AggregatorPlatform;
  serverId: string;
  channelId: string;
  enabled?: boolean;
  allowPaid?: boolean;
  publishMode?: AggregatorPublishMode;
  defaultTimezone?: string;
  notes?: string | null;
}

export interface UpdateSourceInput {
  name?: string;
  serverId?: string;
  channelId?: string;
  enabled?: boolean;
  allowPaid?: boolean;
  publishMode?: AggregatorPublishMode;
  defaultTimezone?: string;
  notes?: string | null;
}

const normalizeOptionalText = (value: string | null | undefined): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const sourceService = {
  async list() {
    return listAggregatorSources();
  },

  async getById(sourceId: string) {
    return getAggregatorSourceById(sourceId);
  },

  async getByDiscordChannel(serverId: string, channelId: string) {
    return getAggregatorSourceByDiscordChannel(serverId, channelId);
  },

  async create(input: CreateSourceInput) {
    return createAggregatorSource({
      ...input,
      notes: normalizeOptionalText(input.notes),
      defaultTimezone: normalizeOptionalText(input.defaultTimezone) ?? undefined,
    });
  },

  async update(sourceId: string, input: UpdateSourceInput) {
    return updateAggregatorSource(sourceId, {
      ...input,
      notes: normalizeOptionalText(input.notes),
      defaultTimezone: normalizeOptionalText(input.defaultTimezone) ?? undefined,
    });
  },

  async setEnabled(sourceId: string, enabled: boolean) {
    return setAggregatorSourceEnabled(sourceId, enabled);
  },
};
