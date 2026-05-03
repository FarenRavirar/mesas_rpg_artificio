import crypto from 'node:crypto';
import { db } from '../db';
import type { DiscordImportSourceKind } from './types';

interface DiscordApiMessage {
  id: string;
  content: string;
  timestamp: string;
  edited_timestamp: string | null;
  author?: { id: string; username: string };
  attachments?: unknown[];
  embeds?: unknown[];
}

export interface IngestResult {
  inserted: number;
  updated: number;
  total: number;
}

/**
 * Busca mensagens de um canal via REST API Discord e salva em discord_import_messages.
 * Idempotente: mensagens existentes so sao atualizadas se o content_hash mudou.
 */
export async function ingestMessages(params: {
  sourceId: string;
  channelId: string;
  guildId: string;
  botToken: string;
  limit?: number;
  beforeMessageId?: string;
  sourceKind?: DiscordImportSourceKind;
}): Promise<IngestResult> {
  const {
    sourceId,
    channelId,
    guildId,
    botToken,
    limit = 50,
    beforeMessageId,
    sourceKind = 'discord_bot',
  } = params;

  const url = new URL(`https://discord.com/api/v10/channels/${channelId}/messages`);
  url.searchParams.set('limit', String(Math.min(limit, 100)));
  if (beforeMessageId) url.searchParams.set('before', beforeMessageId);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bot ${botToken}` },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord API ${res.status}: ${body}`);
  }

  const messages = (await res.json()) as DiscordApiMessage[];

  let inserted = 0;
  let updated = 0;

  for (const msg of messages) {
    const contentRaw = msg.content ?? '';
    const contentHash = crypto.createHash('sha256').update(contentRaw).digest('hex');
    const messageUrl = `https://discord.com/channels/${guildId}/${channelId}/${msg.id}`;

    const existing = await db
      .selectFrom('discord_import_messages')
      .select(['id', 'content_hash'])
      .where('discord_channel_id', '=', channelId)
      .where('discord_message_id', '=', msg.id)
      .executeTakeFirst();

    if (!existing) {
      await db
        .insertInto('discord_import_messages')
        .values({
          source_id: sourceId,
          discord_message_id: msg.id,
          discord_channel_id: channelId,
          discord_guild_id: guildId,
          discord_author_id: msg.author?.id ?? null,
          discord_author_name: msg.author?.username ?? null,
          discord_message_url: messageUrl,
          content_raw: contentRaw,
          attachments: JSON.stringify(msg.attachments ?? []) as unknown as unknown[],
          embeds: JSON.stringify(msg.embeds ?? []) as unknown as unknown[],
          message_created_at: msg.timestamp ? new Date(msg.timestamp) : null,
          message_edited_at: msg.edited_timestamp ? new Date(msg.edited_timestamp) : null,
          content_hash: contentHash,
          source_kind: sourceKind,
          status: 'pending',
        })
        .execute();
      inserted++;
    } else if (existing.content_hash !== contentHash) {
      await db
        .updateTable('discord_import_messages')
        .set({
          content_raw: contentRaw,
          content_hash: contentHash,
          status: 'pending',
          parse_error: null,
          updated_at: new Date(),
        })
        .where('id', '=', existing.id)
        .execute();
      updated++;
    }
  }

  return { inserted, updated, total: messages.length };
}
