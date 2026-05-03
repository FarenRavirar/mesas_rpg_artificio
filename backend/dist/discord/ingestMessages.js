"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestMessages = ingestMessages;
const node_crypto_1 = __importDefault(require("node:crypto"));
const db_1 = require("../db");
/**
 * Busca mensagens de um canal via REST API Discord e salva em discord_import_messages.
 * Idempotente: mensagens existentes so sao atualizadas se o content_hash mudou.
 * Usa batch SELECT + batch INSERT para evitar N+1 queries.
 */
async function ingestMessages(params) {
    const { sourceId, channelId, guildId, botToken, limit = 50, beforeMessageId, afterMessageId, sourceKind = 'discord_bot', } = params;
    const trimmedToken = botToken.trim();
    if (!trimmedToken)
        throw new Error('DISCORD_BOT_TOKEN não pode ser vazio.');
    const url = new URL(`https://discord.com/api/v10/channels/${channelId}/messages`);
    url.searchParams.set('limit', String(Math.min(limit, 100)));
    if (beforeMessageId)
        url.searchParams.set('before', beforeMessageId);
    if (afterMessageId)
        url.searchParams.set('after', afterMessageId);
    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bot ${trimmedToken}` },
        signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Discord API ${res.status}: ${body}`);
    }
    const messages = (await res.json());
    // Discord retorna mensagens em ordem decrescente de ID (mais recente primeiro)
    const newestMessageId = messages[0]?.id ?? null;
    if (messages.length === 0)
        return { inserted: 0, updated: 0, total: 0, newestMessageId: null };
    // Computa hashes e URLs de todos os mensagens antes de tocar o banco
    const msgData = messages.map((msg) => {
        const contentRaw = msg.content ?? '';
        // Hash cobre content + embeds + attachments para detectar edicoes que so alteram midia
        const contentHash = node_crypto_1.default
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
    const existingRecords = await db_1.db
        .selectFrom('discord_import_messages')
        .select(['id', 'content_hash', 'discord_message_id'])
        .where('discord_channel_id', '=', channelId)
        .where('discord_message_id', 'in', msgData.map((m) => m.msg.id))
        .execute();
    const existingMap = new Map(existingRecords.map((e) => [e.discord_message_id, e]));
    const toInsert = [];
    const toUpdate = [];
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
                attachments: JSON.stringify(msg.attachments ?? []),
                embeds: JSON.stringify(msg.embeds ?? []),
                message_created_at: msg.timestamp ? new Date(msg.timestamp) : null,
                message_edited_at: msg.edited_timestamp ? new Date(msg.edited_timestamp) : null,
                content_hash: contentHash,
                source_kind: sourceKind,
                status: 'pending',
            });
        }
        else if (existing.content_hash !== contentHash) {
            toUpdate.push({ id: existing.id, contentRaw, contentHash });
        }
    }
    if (toInsert.length > 0) {
        await db_1.db.insertInto('discord_import_messages').values(toInsert).execute();
    }
    for (const upd of toUpdate) {
        await db_1.db
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
