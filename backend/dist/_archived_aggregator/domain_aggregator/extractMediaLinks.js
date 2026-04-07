"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMediaLinks = void 0;
const PUBLIC_URL_REGEX = /^https?:\/\//i;
const isPublicUrl = (value) => {
    if (!value)
        return false;
    return PUBLIC_URL_REGEX.test(value.trim());
};
const toLabel = (value) => {
    if (!value)
        return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
};
const extractMediaLinks = (message) => {
    const links = [];
    for (const attachment of message.attachments) {
        const urlValue = attachment.url?.trim() ?? null;
        if (isPublicUrl(urlValue)) {
            links.push({
                kind: 'attachment',
                origin: 'original_url',
                url: urlValue,
                localName: null,
                fileName: attachment.fileName,
                label: toLabel(attachment.fileName),
                isPublicUrl: true,
            });
            continue;
        }
        if (urlValue) {
            links.push({
                kind: 'attachment',
                origin: 'exported_local_name',
                url: urlValue,
                localName: urlValue,
                fileName: attachment.fileName,
                label: toLabel(attachment.fileName),
                isPublicUrl: false,
            });
        }
    }
    for (const embed of message.embeds) {
        const embedUrl = embed.url?.trim() ?? null;
        if (isPublicUrl(embedUrl)) {
            links.push({
                kind: 'embed',
                origin: 'embed_url',
                url: embedUrl,
                localName: null,
                fileName: null,
                label: toLabel(embed.title) ?? toLabel(embed.description),
                isPublicUrl: true,
            });
        }
        const thumbnailCandidates = [embed.thumbnail?.canonicalUrl ?? null, embed.thumbnail?.url ?? null];
        for (const thumbnailValue of thumbnailCandidates) {
            const thumbnailUrl = thumbnailValue?.trim() ?? null;
            if (!isPublicUrl(thumbnailUrl))
                continue;
            links.push({
                kind: 'thumbnail',
                origin: 'thumbnail_canonical_url',
                url: thumbnailUrl,
                localName: null,
                fileName: null,
                label: toLabel(embed.title) ?? 'thumbnail',
                isPublicUrl: true,
            });
            break;
        }
        for (const image of embed.images) {
            const imageUrl = image.url?.trim() ?? null;
            if (!isPublicUrl(imageUrl))
                continue;
            links.push({
                kind: 'embed',
                origin: 'embed_url',
                url: imageUrl,
                localName: null,
                fileName: null,
                label: toLabel(embed.title) ?? 'embed_image',
                isPublicUrl: true,
            });
        }
    }
    const deduped = new Map();
    for (const link of links) {
        const key = `${link.origin}::${link.url}`;
        if (!deduped.has(key)) {
            deduped.set(key, link);
        }
    }
    return Array.from(deduped.values());
};
exports.extractMediaLinks = extractMediaLinks;
