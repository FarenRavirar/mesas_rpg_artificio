"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordSettingsSecretUnavailableError = void 0;
exports.encryptDiscordSetting = encryptDiscordSetting;
exports.decryptDiscordSetting = decryptDiscordSetting;
const node_crypto_1 = require("node:crypto");
const SETTINGS_SALT = 'discord-settings';
const IV_LENGTH = 12;
class DiscordSettingsSecretUnavailableError extends Error {
    constructor() {
        super('JWT_SECRET não configurado para criptografar credenciais Discord.');
        this.name = 'DiscordSettingsSecretUnavailableError';
    }
}
exports.DiscordSettingsSecretUnavailableError = DiscordSettingsSecretUnavailableError;
function getKey() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new DiscordSettingsSecretUnavailableError();
    }
    return (0, node_crypto_1.scryptSync)(secret, SETTINGS_SALT, 32);
}
function encryptDiscordSetting(plaintext) {
    const iv = (0, node_crypto_1.randomBytes)(IV_LENGTH);
    const cipher = (0, node_crypto_1.createCipheriv)('aes-256-gcm', getKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('base64')}`;
}
function decryptDiscordSetting(value) {
    const [ivHex, authTagHex, ciphertextBase64] = value.split(':');
    if (!ivHex || !authTagHex || !ciphertextBase64) {
        throw new Error('Formato de credencial Discord cifrada inválido.');
    }
    const decipher = (0, node_crypto_1.createDecipheriv)('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(ciphertextBase64, 'base64')),
        decipher.final(),
    ]);
    return plaintext.toString('utf8');
}
