"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const publicImageUrl_1 = require("./publicImageUrl");
describe('publicImageUrl', () => {
    it('remove Discord CDN images from public payloads', () => {
        expect((0, publicImageUrl_1.sanitizePublicImageUrl)('https://cdn.discordapp.com/attachments/1/image.png?ex=abc')).toBeNull();
        expect((0, publicImageUrl_1.sanitizePublicImageUrl)('https://media.discordapp.net/attachments/1/Capa_RPG.png?ex=abc')).toBeNull();
    });
    it('keeps stable image URLs and local asset paths', () => {
        expect((0, publicImageUrl_1.sanitizePublicImageUrl)(' https://res.cloudinary.com/demo/image/upload/banner.jpg ')).toBe('https://res.cloudinary.com/demo/image/upload/banner.jpg');
        expect((0, publicImageUrl_1.sanitizePublicImageUrl)('/assets/banner_placeholder.webp')).toBe('/assets/banner_placeholder.webp');
    });
    it('treats empty and non-string values as no public image', () => {
        expect((0, publicImageUrl_1.sanitizePublicImageUrl)('')).toBeNull();
        expect((0, publicImageUrl_1.sanitizePublicImageUrl)(null)).toBeNull();
        expect((0, publicImageUrl_1.sanitizePublicImageUrl)({ url: 'https://cdn.discordapp.com/image.png' })).toBeNull();
    });
    it('detects only parseable Discord CDN hosts', () => {
        expect((0, publicImageUrl_1.isEphemeralDiscordImageUrl)('https://discord.com/channels/1/2/3')).toBe(false);
        expect((0, publicImageUrl_1.isEphemeralDiscordImageUrl)('not a url with cdn.discordapp.com')).toBe(false);
    });
});
