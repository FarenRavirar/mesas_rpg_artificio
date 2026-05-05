"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordIngestError = void 0;
exports.ingestMessages = ingestMessages;
exports.ingestForumMessages = ingestForumMessages;
const node_crypto_1 = __importDefault(require("node:crypto"));
const zod_1 = require("zod");
const db_1 = require("../db");
const config_1 = require("./config");
const DISCORD_API_BASE = 'https://discord.com/api/v10';
const discordApiMessageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    content: zod_1.z.string().optional().default(''),
    timestamp: zod_1.z.string().optional(),
    edited_timestamp: zod_1.z.string().nullable().optional(),
    author: zod_1.z.object({ id: zod_1.z.string(), username: zod_1.z.string() }).optional(),
    attachments: zod_1.z.array(zod_1.z.unknown()).optional(),
    embeds: zod_1.z.array(zod_1.z.unknown()).optional(),
});
const discordApiMessagesSchema = zod_1.z.array(discordApiMessageSchema);
const discordThreadSchema = zod_1.z.object({
    id: zod_1.z.string(),
    parent_id: zod_1.z.string().nullable().optional(),
    name: zod_1.z.string().nullable().optional(),
    archived: zod_1.z.boolean().optional(),
});
const discordActiveThreadsSchema = zod_1.z.object({
    threads: zod_1.z.array(discordThreadSchema),
});
const discordArchivedThreadsSchema = zod_1.z.object({
    threads: zod_1.z.array(discordThreadSchema),
    has_more: zod_1.z.boolean().optional(),
});
class DiscordIngestError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'DiscordIngestError';
    }
}
exports.DiscordIngestError = DiscordIngestError;
function filterMessagesByWindow(messages, since, until) {
    if (!since && !until)
        return messages;
    return messages.filter((message) => {
        if (!message.timestamp)
            return false;
        const createdAt = new Date(message.timestamp);
        if (Number.isNaN(createdAt.getTime()))
            return false;
        if (since && createdAt < since)
            return false;
        if (until && createdAt > until)
            return false;
        return true;
    });
}
function mapDiscordStatus(status) {
    if (status === 401) {
        return new DiscordIngestError('Token do bot inválido ou revogado. Gere um novo token no Discord e salve novamente.', 502);
    }
    if (status === 403) {
        return new DiscordIngestError('O bot não tem permissão para ler esse canal, forum ou thread no Discord.', 403);
    }
    if (status === 404) {
        return new DiscordIngestError('Canal, forum ou thread não encontrado para o bot configurado.', 404);
    }
    if (status === 429) {
        return new DiscordIngestError('Discord limitou temporariamente as requisições. Aguarde um momento e tente novamente.', 502);
    }
    return new DiscordIngestError('Discord não respondeu como esperado. Tente novamente em instantes.', 502);
}
async function discordGetUnknown(path, token) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    try {
        const res = await fetch(`${DISCORD_API_BASE}${path}`, {
            headers: { Authorization: `Bot ${token.trim()}` },
            signal: controller.signal,
        });
        if (!res.ok) {
            throw mapDiscordStatus(res.status);
        }
        return res.json();
    }
    catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw new DiscordIngestError('Discord demorou demais para responder. Tente novamente em instantes.', 502);
        }
        throw error;
    }
    finally {
        clearTimeout(timeoutId);
    }
}
function getContentHash(msg) {
    return node_crypto_1.default
        .createHash('sha256')
        .update(msg.content ?? '')
        .update(JSON.stringify(msg.embeds ?? []))
        .update(JSON.stringify(msg.attachments ?? []))
        .digest('hex');
}
async function fetchChannelMessages(params) {
    const qs = new URLSearchParams({ limit: String(Math.min(params.limit, 100)) });
    if (params.beforeMessageId)
        qs.set('before', params.beforeMessageId);
    if (params.afterMessageId)
        qs.set('after', params.afterMessageId);
    const payload = await discordGetUnknown(`/channels/${params.channelId}/messages?${qs}`, params.token);
    const parsed = discordApiMessagesSchema.safeParse(payload);
    if (!parsed.success) {
        throw new DiscordIngestError('Discord retornou mensagens em formato inesperado.', 502);
    }
    return parsed.data;
}
async function persistMessages(params) {
    const { sourceId, channelId, guildId, messages, sourceKind, parentChannelId = null, threadId = null, threadName = null, } = params;
    const newestMessageId = messages[0]?.id ?? null;
    if (messages.length === 0)
        return { inserted: 0, updated: 0, total: 0, newestMessageId: null };
    const msgData = messages.map((msg) => ({
        msg,
        contentRaw: msg.content ?? '',
        contentHash: getContentHash(msg),
        messageUrl: `https://discord.com/channels/${guildId}/${channelId}/${msg.id}`,
    }));
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
                discord_parent_channel_id: parentChannelId,
                discord_thread_id: threadId,
                discord_thread_name: threadName,
                discord_author_id: msg.author?.id ?? null,
                discord_author_name: msg.author?.username ?? null,
                discord_message_url: messageUrl,
                content_raw: contentRaw,
                attachments: (msg.attachments ?? []),
                embeds: (msg.embeds ?? []),
                message_created_at: msg.timestamp ? new Date(msg.timestamp) : null,
                message_edited_at: msg.edited_timestamp ? new Date(msg.edited_timestamp) : null,
                content_hash: contentHash,
                source_kind: sourceKind,
                status: 'pending',
            });
        }
        else if (existing.content_hash !== contentHash) {
            toUpdate.push({ id: existing.id, contentRaw, contentHash, embeds: (msg.embeds ?? []), attachments: (msg.attachments ?? []) });
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
            embeds: upd.embeds,
            attachments: upd.attachments,
            status: 'pending',
            parse_error: null,
            updated_at: new Date(),
        })
            .where('id', '=', upd.id)
            .execute();
    }
    return { inserted: toInsert.length, updated: toUpdate.length, total: messages.length, newestMessageId };
}
async function listForumThreads(params) {
    const activePayload = await discordGetUnknown(`/guilds/${encodeURIComponent(params.guildId)}/threads/active`, params.token);
    const activeParsed = discordActiveThreadsSchema.safeParse(activePayload);
    if (!activeParsed.success) {
        throw new DiscordIngestError('Discord retornou threads ativas em formato inesperado.', 502);
    }
    const archivedPayload = await discordGetUnknown(`/channels/${encodeURIComponent(params.forumChannelId)}/threads/archived/public?limit=50`, params.token);
    const archivedParsed = discordArchivedThreadsSchema.safeParse(archivedPayload);
    if (!archivedParsed.success) {
        throw new DiscordIngestError('Discord retornou threads arquivadas em formato inesperado.', 502);
    }
    const byId = new Map();
    for (const thread of activeParsed.data.threads) {
        if (thread.parent_id === params.forumChannelId)
            byId.set(thread.id, thread);
    }
    for (const thread of archivedParsed.data.threads) {
        byId.set(thread.id, thread);
    }
    return [...byId.values()].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'pt-BR'));
}
/**
 * Busca mensagens de um canal textual/anuncio via REST API Discord.
 */
async function ingestMessages(params) {
    const { sourceId, channelId, guildId, botToken, limit = 50, beforeMessageId, afterMessageId, sourceKind = 'discord_bot', since, until, } = params;
    const resolvedToken = botToken ?? await (0, config_1.requireDiscordBotToken)();
    const trimmedToken = resolvedToken.trim();
    if (!trimmedToken)
        throw new DiscordIngestError('Token do bot Discord não pode ser vazio.', 422);
    const messages = await fetchChannelMessages({
        channelId,
        token: trimmedToken,
        limit,
        beforeMessageId,
        afterMessageId,
    });
    const result = await persistMessages({
        sourceId,
        channelId,
        guildId,
        messages: filterMessagesByWindow(messages, since, until),
        sourceKind,
    });
    return { ...result, threadsScanned: 0, sourceKind: 'text' };
}
async function ingestForumMessages(params) {
    const { sourceId, forumChannelId, guildId, botToken, limit = 50, sourceKind = 'discord_bot', since, until, } = params;
    const resolvedToken = botToken ?? await (0, config_1.requireDiscordBotToken)();
    const trimmedToken = resolvedToken.trim();
    if (!trimmedToken)
        throw new DiscordIngestError('Token do bot Discord não pode ser vazio.', 422);
    const threads = await listForumThreads({ guildId, forumChannelId, token: trimmedToken });
    if (threads.length === 0) {
        return { inserted: 0, updated: 0, total: 0, newestMessageId: null, threadsScanned: 0, sourceKind: 'forum' };
    }
    let inserted = 0;
    let updated = 0;
    let total = 0;
    let newestMessageId = null;
    for (const thread of threads) {
        const messages = await fetchChannelMessages({
            channelId: thread.id,
            token: trimmedToken,
            limit,
        });
        const result = await persistMessages({
            sourceId,
            channelId: thread.id,
            guildId,
            messages: filterMessagesByWindow(messages, since, until),
            sourceKind,
            parentChannelId: forumChannelId,
            threadId: thread.id,
            threadName: thread.name ?? null,
        });
        inserted += result.inserted;
        updated += result.updated;
        total += result.total;
        newestMessageId ??= result.newestMessageId;
    }
    return { inserted, updated, total, newestMessageId, threadsScanned: threads.length, sourceKind: 'forum' };
}
