"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLinkType = detectLinkType;
exports.generateEmbedUrl = generateEmbedUrl;
exports.getUserLinks = getUserLinks;
exports.createUserLink = createUserLink;
exports.deleteUserLink = deleteUserLink;
exports.updateLinksOrder = updateLinksOrder;
const index_1 = require("../db/index");
/**
 * Detecta o tipo de link baseado na URL
 */
function detectLinkType(url) {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
        return 'youtube';
    }
    if (urlLower.includes('spotify.com')) {
        return 'spotify';
    }
    if (urlLower.includes('twitch.tv')) {
        return 'twitch';
    }
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
        return 'twitter';
    }
    if (urlLower.includes('instagram.com')) {
        return 'instagram';
    }
    if (urlLower.includes('facebook.com')) {
        return 'facebook';
    }
    if (urlLower.includes('tiktok.com')) {
        return 'tiktok';
    }
    if (urlLower.includes('linkedin.com')) {
        return 'linkedin';
    }
    if (urlLower.includes('wa.me') || urlLower.includes('whatsapp.com') || urlLower.includes('api.whatsapp.com')) {
        return 'whatsapp';
    }
    // Podcasts genéricos
    if (urlLower.includes('anchor.fm') ||
        urlLower.includes('podcasters.spotify') ||
        urlLower.includes('deezer.com') ||
        urlLower.includes('apple.com/podcast')) {
        return 'podcast';
    }
    if (urlLower.includes('medium.com') || urlLower.includes('substack.com')) {
        return 'article';
    }
    return 'website';
}
/**
 * Extrai ID do vídeo do YouTube de uma URL
 */
function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match)
            return match[1];
    }
    return null;
}
/**
 * Extrai ID do Spotify de uma URL
 */
function extractSpotifyId(url) {
    const match = url.match(/spotify\.com\/(track|album|playlist|episode|show)\/([^?&\n]+)/);
    if (match) {
        return { type: match[1], id: match[2] };
    }
    return null;
}
/**
 * Gera URL de embed para links suportados
 */
function generateEmbedUrl(url, type) {
    switch (type) {
        case 'youtube': {
            const videoId = extractYouTubeId(url);
            return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
        }
        case 'spotify': {
            const spotifyData = extractSpotifyId(url);
            return spotifyData ? `https://open.spotify.com/embed/${spotifyData.type}/${spotifyData.id}` : null;
        }
        case 'twitch': {
            const match = url.match(/twitch\.tv\/videos\/(\d+)/);
            if (match) {
                return `https://player.twitch.tv/?video=${match[1]}&parent=${process.env.DOMAIN || 'localhost'}`;
            }
            const channelMatch = url.match(/twitch\.tv\/([^/\n?]+)/);
            if (channelMatch) {
                return `https://player.twitch.tv/?channel=${channelMatch[1]}&parent=${process.env.DOMAIN || 'localhost'}`;
            }
            return null;
        }
        default:
            return null;
    }
}
/**
 * Extrai metadata básica de uma URL
 * Nota: Implementação simplificada. Para produção, usar biblioteca como metascraper
 */
async function extractMetadata(url, type) {
    // Para YouTube, podemos extrair metadata da URL
    if (type === 'youtube') {
        const videoId = extractYouTubeId(url);
        if (videoId) {
            return {
                title: 'Vídeo no YouTube',
                thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            };
        }
    }
    // Para outros tipos, retornar metadata básica
    // TODO: Implementar extração real via Open Graph quando necessário
    return {
        title: new URL(url).hostname,
    };
}
/**
 * Lista todos os links de um usuário
 */
const kysely_1 = require("kysely");
async function getUserLinks(userId) {
    const links = await index_1.db
        .selectFrom('user_links')
        .selectAll()
        .where('user_id', '=', userId)
        .orderBy('sort_order', 'asc')
        .orderBy('created_at', 'desc')
        .execute();
    if (links.length > 0) {
        const linkIds = links.map(l => l.id);
        index_1.db.updateTable('user_links')
            .set({ metadata_last_accessed_at: (0, kysely_1.sql) `NOW()` })
            .where('id', 'in', linkIds)
            .where('metadata_last_accessed_at', '<', (0, kysely_1.sql) `NOW() - interval '6 hours'`)
            .execute()
            .catch(e => console.error('[getUserLinks] Falha ao atualizar acesso do link:', e));
        if (links.some(l => l.metadata_status === 'pending')) {
            const { processPendingLinks } = require('../scripts/processLinkMetadataJobs');
            processPendingLinks().catch((err) => console.error('Silent processPending error:', err));
        }
    }
    // Adicionar embed_url para cada link
    return links.map((link) => ({
        ...link,
        embed_url: generateEmbedUrl(link.url, link.type),
    }));
}
/**
 * Cria um novo link para o usuário
 */
async function createUserLink(userId, input) {
    const { url } = input;
    // Validar URL
    try {
        new URL(url);
    }
    catch {
        throw new Error('URL inválida');
    }
    // Verificar limite de links (máximo 10)
    const result = await index_1.db
        .selectFrom('user_links')
        .select(index_1.db.fn.count('id').as('count'))
        .where('user_id', '=', userId)
        .executeTakeFirst();
    const existingCount = result ? Number(result.count) : 0;
    if (existingCount >= 10) {
        throw new Error('Limite de 10 links atingido');
    }
    // Detectar tipo
    const type = detectLinkType(url);
    // Criar link (sem fazer scrapping síncrono - delega ao worker background)
    const link = await index_1.db
        .insertInto('user_links')
        .values({
        user_id: userId,
        url,
        type,
        title: null,
        description: null,
        thumbnail_url: null,
        metadata_status: 'pending',
        sort_order: 0,
    })
        .returningAll()
        .executeTakeFirstOrThrow();
    // Fire and forget o worker pro link novo
    const { processPendingLinks } = require('../scripts/processLinkMetadataJobs');
    processPendingLinks().catch((err) => console.error('Silent processPending error:', err));
    return {
        ...link,
        embed_url: generateEmbedUrl(link.url, type),
    };
}
/**
 * Remove um link do usuário
 */
async function deleteUserLink(userId, linkId) {
    const result = await index_1.db
        .deleteFrom('user_links')
        .where('id', '=', linkId)
        .where('user_id', '=', userId)
        .executeTakeFirst();
    if (result.numDeletedRows === 0n) {
        throw new Error('Link não encontrado');
    }
}
/**
 * Atualiza a ordem dos links
 */
async function updateLinksOrder(userId, linkIds) {
    // Atualizar sort_order de cada link
    const updates = linkIds.map((linkId, index) => index_1.db
        .updateTable('user_links')
        .set({ sort_order: index })
        .where('id', '=', linkId)
        .where('user_id', '=', userId)
        .execute());
    await Promise.all(updates);
}
