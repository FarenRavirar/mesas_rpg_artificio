"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGoogleUserContentUrl = isGoogleUserContentUrl;
exports.upgradeGoogleImageQuality = upgradeGoogleImageQuality;
/**
 * Valida se uma URL é do Google User Content de forma segura
 * Verifica o hostname completo para evitar bypass com substrings
 */
function isGoogleUserContentUrl(url) {
    if (!url)
        return false;
    try {
        const parsed = new URL(url);
        return parsed.hostname.endsWith('.googleusercontent.com') ||
            parsed.hostname === 'googleusercontent.com';
    }
    catch {
        return false;
    }
}
/**
 * Aumenta a qualidade de imagens do Google User Content
 * Substitui o parâmetro de tamanho para obter imagens maiores
 */
function upgradeGoogleImageQuality(url, size = 400) {
    if (!isGoogleUserContentUrl(url))
        return url;
    return url.replace(/=s\d+-c$/, `=s${size}-c`);
}
