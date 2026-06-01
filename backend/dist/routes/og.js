"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promises_1 = require("fs/promises");
const kysely_1 = require("kysely");
const db_1 = require("../db");
const urlValidation_1 = require("../utils/urlValidation");
const router = (0, express_1.Router)();
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://mesas.artificiorpg.com';
const SITE_NAME = 'Artifício Mesas';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;
const INDEX_HTML_PATH = process.env.INDEX_HTML_PATH || '/app/frontend-dist/index.html';
let cachedIndexHtml = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60 * 1000;
async function loadIndexHtml() {
    const now = Date.now();
    if (cachedIndexHtml && now - cacheLoadedAt < CACHE_TTL_MS) {
        return cachedIndexHtml;
    }
    const raw = await (0, promises_1.readFile)(INDEX_HTML_PATH, 'utf-8');
    cachedIndexHtml = raw;
    cacheLoadedAt = now;
    return raw;
}
function escapeHtml(input) {
    if (!input)
        return '';
    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function truncate(input, max) {
    if (!input)
        return '';
    const cleaned = input.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= max)
        return cleaned;
    return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}
function injectMetaTags(html, meta) {
    const title = escapeHtml(meta.title);
    const description = escapeHtml(meta.description);
    const imageUrl = escapeHtml(meta.imageUrl);
    const canonicalUrl = escapeHtml(meta.canonicalUrl);
    let profileExtra = '';
    if (meta.extraProfile) {
        for (const [key, value] of Object.entries(meta.extraProfile)) {
            profileExtra += `\n    <meta property="${escapeHtml(key)}" content="${escapeHtml(value)}">`;
        }
    }
    const metaBlock = `
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonicalUrl}">
    <meta property="og:type" content="${meta.ogType}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${imageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">
    <meta property="og:locale" content="pt_BR">${profileExtra}
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${imageUrl}">
  `.trim();
    // Remove meta tags OG/Twitter duplicadas do index.html
    let output = html
        .replace(/<meta\s+property="og:[^"]*"\s+content="[^"]*"\s*\/?\s*>/gi, '')
        .replace(/<meta\s+name="twitter:[^"]*"\s+content="[^"]*"\s*\/?\s*>/gi, '')
        .replace(/<!--\s*Open Graph fallback[\s\S]*?-->/gi, '')
        .replace(/<!--\s*Twitter Card fallback[\s\S]*?-->/gi, '');
    // Substitui o <title> pelas novas meta tags
    output = output.replace(/<title>[\s\S]*?<\/title>/i, metaBlock);
    if (output === html) {
        output = html.replace('</head>', `${metaBlock}\n  </head>`);
    }
    return output;
}
function getFallbackMeta(pathname = '/') {
    return {
        title: 'Artifício Mesas — Encontre sua próxima aventura de RPG',
        description: 'Plataforma gratuita para encontrar mesas de RPG. Descubra mestres e aventuras de D&D, Pathfinder e outros sistemas.',
        imageUrl: DEFAULT_OG_IMAGE,
        canonicalUrl: `${SITE_URL}${pathname}`,
        ogType: 'website',
    };
}
router.get('/:type/:slug', async (req, res) => {
    const { type, slug } = req.params;
    try {
        const html = await loadIndexHtml();
        // Switch para diferentes tipos de entidades
        switch (type) {
            case 'mestre': {
                const gm = await db_1.db
                    .selectFrom('gm_profiles as gm')
                    .innerJoin('users as u', 'u.id', 'gm.user_id')
                    .innerJoin('profiles as p', 'p.user_id', 'u.id')
                    .select([
                    (0, kysely_1.sql) `COALESCE(gm.nickname, p.display_name)`.as('display_name'),
                    'gm.bio_long',
                    'gm.tagline',
                    (0, kysely_1.sql) `COALESCE(gm.avatar_url, p.avatar_url)`.as('avatar_url'),
                    'gm.banner_url',
                    'gm.slug',
                ])
                    .where('gm.slug', '=', slug)
                    .executeTakeFirst();
                if (!gm) {
                    const htmlNotFound = injectMetaTags(html, {
                        ...getFallbackMeta(`/mestre/${slug}`),
                        title: 'Mestre não encontrado — Artifício Mesas',
                    });
                    return res.status(200).type('html').send(htmlNotFound);
                }
                const displayName = gm.display_name || 'Mestre de RPG';
                const title = `${displayName} — Mestre de RPG | ${SITE_NAME}`;
                const description = truncate(gm.tagline ||
                    gm.bio_long ||
                    `Conheça o perfil do mestre ${displayName} e descubra suas mesas ativas no ${SITE_NAME}.`, 200);
                // Aumenta tamanho de imagens do Google para atender requisitos do Facebook (mínimo 200x200)
                let imageUrl = gm.avatar_url || gm.banner_url || DEFAULT_OG_IMAGE;
                imageUrl = (0, urlValidation_1.upgradeGoogleImageQuality)(imageUrl, 400);
                const output = injectMetaTags(html, {
                    title,
                    description,
                    imageUrl,
                    canonicalUrl: `${SITE_URL}/mestre/${encodeURIComponent(gm.slug)}`,
                    ogType: 'profile',
                    extraProfile: {
                        'profile:username': gm.slug,
                    },
                });
                return res.status(200).type('html').send(output);
            }
            // Futuros tipos podem ser adicionados aqui:
            // case 'mesa': { ... }
            // case 'evento': { ... }
            default: {
                // Tipo não suportado - retorna fallback
                const htmlFallback = injectMetaTags(html, getFallbackMeta(`/${type}/${slug}`));
                return res.status(200).type('html').send(htmlFallback);
            }
        }
    }
    catch (error) {
        console.error('[GET /og/:type/:slug]', { type, slug }, error);
        try {
            const html = await loadIndexHtml();
            const output = injectMetaTags(html, getFallbackMeta(`/${type}/${slug}`));
            return res.status(200).type('html').send(output);
        }
        catch {
            return res.status(500).send('Internal error');
        }
    }
});
router.get('*', async (req, res) => {
    try {
        const html = await loadIndexHtml();
        const output = injectMetaTags(html, getFallbackMeta(req.path));
        return res.status(200).type('html').send(output);
    }
    catch {
        return res.status(500).send('Internal error');
    }
});
exports.default = router;
