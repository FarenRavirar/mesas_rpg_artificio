"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const settingsCrypto_1 = require("../settingsCrypto");
const previousJwtSecret = process.env.JWT_SECRET;
describe('settingsCrypto', () => {
    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret-for-settings-crypto';
    });
    afterAll(() => {
        process.env.JWT_SECRET = previousJwtSecret;
    });
    it('encrypts Discord settings with a random per-value salt', () => {
        const first = (0, settingsCrypto_1.encryptDiscordSetting)('bot-token');
        const second = (0, settingsCrypto_1.encryptDiscordSetting)('bot-token');
        expect(first).not.toBe(second);
        expect(first.split(':')).toHaveLength(5);
        expect(second.split(':')).toHaveLength(5);
        expect((0, settingsCrypto_1.decryptDiscordSetting)(first)).toBe('bot-token');
        expect((0, settingsCrypto_1.decryptDiscordSetting)(second)).toBe('bot-token');
    });
    it('keeps decrypting legacy values encrypted with the previous salt', () => {
        const legacy = '00112233445566778899aabb:a4f7d3d51ff5fe3b9681af586588274f:2MCmUvL5IuGC';
        expect((0, settingsCrypto_1.decryptDiscordSetting)(legacy)).toBe('bot-token');
    });
});
