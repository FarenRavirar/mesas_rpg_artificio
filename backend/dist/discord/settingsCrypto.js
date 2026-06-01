"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordSettingsSecretUnavailableError = void 0;
exports.encryptDiscordSetting = encryptDiscordSetting;
exports.decryptDiscordSetting = decryptDiscordSetting;
const node_crypto_1 = require("node:crypto");
const LEGACY_SETTINGS_SALT = 'discord-settings';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ENCRYPTION_VERSION = 'v2';
class DiscordSettingsSecretUnavailableError extends Error {
    constructor() {
        super('JWT_SECRET não configurado para criptografar credenciais Discord.');
        this.name = 'DiscordSettingsSecretUnavailableError';
    }
}
exports.DiscordSettingsSecretUnavailableError = DiscordSettingsSecretUnavailableError;
function getKey(salt) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new DiscordSettingsSecretUnavailableError();
    }
    return (0, node_crypto_1.scryptSync)(secret, salt, 32);
}
function encryptDiscordSetting(plaintext) {
    const salt = (0, node_crypto_1.randomBytes)(SALT_LENGTH);
    const iv = (0, node_crypto_1.randomBytes)(IV_LENGTH);
    const cipher = (0, node_crypto_1.createCipheriv)('aes-256-gcm', getKey(salt), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [
        ENCRYPTION_VERSION,
        salt.toString('hex'),
        iv.toString('hex'),
        authTag.toString('hex'),
        ciphertext.toString('base64'),
    ].join(':');
}
function decryptDiscordSetting(value) {
    const parts = value.split(':');
    if (parts[0] === ENCRYPTION_VERSION) {
        const [, saltHex, ivHex, authTagHex, ciphertextBase64] = parts;
        if (!saltHex || !ivHex || !authTagHex || !ciphertextBase64) {
            throw new Error('Formato de credencial Discord cifrada inválido.');
        }
        const decipher = (0, node_crypto_1.createDecipheriv)('aes-256-gcm', getKey(Buffer.from(saltHex, 'hex')), Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
        const plaintext = Buffer.concat([
            decipher.update(Buffer.from(ciphertextBase64, 'base64')),
            decipher.final(),
        ]);
        return plaintext.toString('utf8');
    }
    const [ivHex, authTagHex, ciphertextBase64] = parts;
    if (!ivHex || !authTagHex || !ciphertextBase64) {
        throw new Error('Formato de credencial Discord cifrada inválido.');
    }
    const decipher = (0, node_crypto_1.createDecipheriv)('aes-256-gcm', getKey(LEGACY_SETTINGS_SALT), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertextBase64, 'base64')),
        decipher.final(),
    ]);
    return plaintext.toString('utf8');
}
