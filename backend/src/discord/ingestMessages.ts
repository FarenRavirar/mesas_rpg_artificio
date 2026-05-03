import crypto from 'node:crypto';
import { db } from '../db';
import type { DiscordImportSourceKind } from './types';
import { requireDiscordBotToken } from './config';

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
  newestMessageId: string | null;
}

type InsertRow = {
  source_id: string;
  discord_message_id: string;
  discord_channel_id: string;
  discord_guild_id: string;
  discord_author_id: string | null;
  discord_author_name: string | null;
  discord_message_url: string;
  content_raw: string;
  attachments: unknown[];
  embeds: unknown[];
  message_created_at: Date | null;
  message_edited_at: Date | null;
  content_hash: string;
  source_kind: DiscordImportSourceKind;
  status: 'pending';
};

type UpdateRow = { id: string; contentRaw: string; contentHash: string };

/**
 * Busca mensagens de um canal via REST API Discord e salva em discord_import_messages.
 * Idempotente: mensagens existentes so sao atualizadas se o content_hash mudou.
 * Usa batch SELECT + batch INSERT para evitar N+1 queries.
 */
export async function ingestMessages(params: {
  sourceId: string;
  channelId: string;
  guildId: string;
  botToken?: string;
  limit?: number;
  beforeMessageId?: string;
  afterMessageId?: string;
  sourceKind?: DiscordImportSourceKind;
}): Promise<IngestResult> {
  const {
    sourceId,
    channelId,
    guildId,
    botToken,
    limit = 50,
    beforeMessageId,
    afterMessageId,
    sourceKind = 'discord_bot',
  } = params;

  const resolvedToken = botToken ?? await requireDiscordBotToken();
  const trimmedToken = resolvedToken.trim();
  if (!trimmedToken) throw new Error('DISCORD_BOT_TOKEN não pode ser vazio.');

  const url = new URL(`https://discord.com/api/v10/channels/${channelId}/messages`);
  url.searchParams.set('limit', String(Math.min(limit, 100)));
  if (beforeMessageId) url.searchParams.set('before', beforeMessageId);
  if (afterMessageId) url.searchParams.set('after', afterMessageId);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bot ${trimmedToken}` },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord API ${res.status}: ${body}`);
  }

  const messages = (await res.json()) as DiscordApiMessage[];

  // Discord retorna mensagens em ordem decrescente de ID (mais recente primeiro)
  const newestMessageId = messages[0]?.id ?? null;

  if (messages.length === 0) return { inserted: 0, updated: 0, total: 0, newestMessageId: null };

  // Computa hashes e URLs de todos os mensagens antes de tocar o banco
  const msgData = messages.map((msg) => {
    const contentRaw = msg.content ?? '';
    // Hash cobre content + embeds + attachments para detectar edicoes que so alteram midia
    const contentHash = crypto
      .createHash('sha256')
      .update(contentRaw)
      .update(JSON.stringify(msg.embeds ?? []))
      .update(JSON.stringify(msg.attachments ?? []))
      .digest('hex');
    return {
      msg,
      contentRaw,
      contentHash,
      messageUrl: `https://discord.com/channels/${guildId}/${channelId}/${msg.id}`,
    };
  });

  // Um SELECT para todos os IDs: evita N+1
  const existingRecords = await db
    .selectFrom('discord_import_messages')
    .select(['id', 'content_hash', 'discord_message_id'])
    .where('discord_channel_id', '=', channelId)
    .where('discord_message_id', 'in', msgData.map((m) => m.msg.id))
    .execute();

  const existingMap = new Map(existingRecords.map((e) => [e.discord_message_id, e]));

  const toInsert: InsertRow[] = [];
  const toUpdate: UpdateRow[] = [];

  for (const { msg, contentRaw, contentHash, messageUrl } of msgData) {
    const existing = existingMap.get(msg.id);
    if (!existing) {
      toInsert.push({
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
      });
    } else if (existing.content_hash !== contentHash) {
      toUpdate.push({ id: existing.id, contentRaw, contentHash });
    }
  }

  if (toInsert.length > 0) {
    await db.insertInto('discord_import_messages').values(toInsert).execute();
  }

  for (const upd of toUpdate) {
    await db
      .updateTable('discord_import_messages')
      .set({
        content_raw: upd.contentRaw,
        content_hash: upd.contentHash,
        status: 'pending',
        parse_error: null,
        updated_at: new Date(),
      })
      .where('id', '=', upd.id)
      .execute();
  }

  return { inserted: toInsert.length, updated: toUpdate.length, total: messages.length, newestMessageId };
}
