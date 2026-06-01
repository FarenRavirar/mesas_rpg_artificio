"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uploadDiscordImage_1 = require("../uploadDiscordImage");
function imageResponse(body, init = {}) {
    return new Response(Buffer.from(body), {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
        ...init,
    });
}
describe('uploadDiscordImageToCloudinary', () => {
    it('uploads downloaded Discord image bytes to Cloudinary with sha256 public_id', async () => {
        const fetchImpl = jest.fn()
            .mockResolvedValue(imageResponse('image-bytes'));
        const uploadBuffer = jest.fn()
            .mockResolvedValue({ url: 'https://res.cloudinary.com/demo/image/upload/discord-imports/hash.jpg', public_id: 'discord-imports/hash' });
        const result = await (0, uploadDiscordImage_1.uploadDiscordImageToCloudinary)('https://cdn.discordapp.com/a.jpg', { fetchImpl, uploadBuffer });
        expect(result.status).toBe('success');
        expect(fetchImpl).toHaveBeenCalledWith('https://cdn.discordapp.com/a.jpg', expect.objectContaining({ signal: expect.any(AbortSignal) }));
        expect(uploadBuffer).toHaveBeenCalledWith(expect.any(Buffer), 'image/jpeg', expect.stringMatching(/^[a-f0-9]{64}$/));
    });
    it('categorizes expired Discord CDN URLs', async () => {
        const fetchImpl = jest.fn()
            .mockResolvedValue(new Response('', { status: 404 }));
        const result = await (0, uploadDiscordImage_1.uploadDiscordImageToCloudinary)('https://cdn.discordapp.com/expired.jpg', { fetchImpl });
        expect(result.status).toBe('expired_url');
    });
    it('categorizes Cloudinary upload failures', async () => {
        const fetchImpl = jest.fn()
            .mockResolvedValue(imageResponse('image-bytes'));
        const uploadBuffer = jest.fn().mockRejectedValue(new Error('cloudinary down'));
        const result = await (0, uploadDiscordImage_1.uploadDiscordImageToCloudinary)('https://cdn.discordapp.com/a.jpg', { fetchImpl, uploadBuffer });
        expect(result).toEqual({ status: 'cloudinary', error: 'cloudinary down' });
    });
});
