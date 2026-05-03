import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const SETTINGS_SALT = 'discord-settings';
const IV_LENGTH = 12;

export class DiscordSettingsSecretUnavailableError extends Error {
  constructor() {
    super('JWT_SECRET não configurado para criptografar credenciais Discord.');
    this.name = 'DiscordSettingsSecretUnavailableError';
  }
}

function getKey(): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new DiscordSettingsSecretUnavailableError();
  }
  return scryptSync(secret, SETTINGS_SALT, 32);
}

export function encryptDiscordSetting(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('base64')}`;
}

export function decryptDiscordSetting(value: string): string {
  const [ivHex, authTagHex, ciphertextBase64] = value.split(':');
  if (!ivHex || !authTagHex || !ciphertextBase64) {
    throw new Error('Formato de credencial Discord cifrada inválido.');
  }

  const decipher = createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextBase64, 'base64')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}
