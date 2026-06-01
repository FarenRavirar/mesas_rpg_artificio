"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEphemeralDiscordImageUrl = isEphemeralDiscordImageUrl;
exports.sanitizePublicImageUrl = sanitizePublicImageUrl;
const DISCORD_EPHEMERAL_IMAGE_HOSTS = new Set([
    'cdn.discordapp.com',
    'cdn.discordapp.net',
    'media.discordapp.com',
    'media.discordapp.net',
]);
function isEphemeralDiscordImageUrl(value) {
    if (typeof value !== 'string')
        return false;
    const trimmed = value.trim();
    if (!trimmed)
        return false;
    try {
        const url = new URL(trimmed);
        return DISCORD_EPHEMERAL_IMAGE_HOSTS.has(url.hostname.toLowerCase());
    }
    catch {
        return false;
    }
}
function sanitizePublicImageUrl(value) {
    if (typeof value !== 'string')
        return null;
    const trimmed = value.trim();
    if (!trimmed || isEphemeralDiscordImageUrl(trimmed))
        return null;
    return trimmed;
}
