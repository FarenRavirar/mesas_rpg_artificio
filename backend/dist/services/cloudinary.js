"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageToCloudinary = uploadImageToCloudinary;
exports.uploadRemoteImageToCloudinary = uploadRemoteImageToCloudinary;
const cloudinary_1 = require("cloudinary");
const promises_1 = require("node:dns/promises");
const node_http_1 = __importDefault(require("node:http"));
const node_https_1 = __importDefault(require("node:https"));
const node_net_1 = require("node:net");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('[cloudinary] Config loaded:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'MISSING',
    api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'MISSING',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'MISSING',
});
async function uploadImageToCloudinary(imageUrl) {
    try {
        const transformations = [
            { width: 1200, height: 650, crop: 'fill' },
            { quality: 'auto', fetch_format: 'auto' }
        ];
        const result = await cloudinary_1.v2.uploader.upload(imageUrl, {
            folder: 'mesas_rpg',
            transformation: transformations
        });
        return {
            secure_url: result.secure_url,
            public_id: result.public_id
        };
    }
    catch (error) {
        console.error('[cloudinary] Upload failed:', error?.message || error);
        throw error;
    }
}
const MAX_REMOTE_IMAGE_BYTES = 5 * 1024 * 1024;
const REMOTE_IMAGE_TIMEOUT_MS = 10000;
const MAX_REMOTE_IMAGE_REDIRECTS = 3;
const ALLOWED_REMOTE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
function isPrivateIp(address) {
    if ((0, node_net_1.isIP)(address) === 4) {
        const parts = address.split('.').map((part) => Number(part));
        const [first, second, third] = parts;
        if (first === 0)
            return true;
        if (first === 10)
            return true;
        if (first === 127)
            return true;
        if (first === 169 && second === 254)
            return true;
        if (first === 172 && second >= 16 && second <= 31)
            return true;
        if (first === 192 && second === 168)
            return true;
        if (first === 100 && second >= 64 && second <= 127)
            return true;
        if (first === 192 && second === 0 && third === 0)
            return true;
        if (first === 192 && second === 0 && third === 2)
            return true;
        if (first === 198 && (second === 18 || second === 19))
            return true;
        if (first === 198 && second === 51 && third === 100)
            return true;
        if (first === 203 && second === 0 && third === 113)
            return true;
        if (first >= 224)
            return true;
        return false;
    }
    if ((0, node_net_1.isIP)(address) === 6) {
        const normalized = address.toLowerCase();
        if (normalized === '::' || normalized === '::1')
            return true;
        if (normalized.startsWith('::ffff:')) {
            return isPrivateIp(normalized.replace(/^::ffff:/, ''));
        }
        const firstBlock = Number.parseInt(normalized.split(':')[0] || '0', 16);
        if ((firstBlock & 0xfe00) === 0xfc00)
            return true; // fc00::/7
        if ((firstBlock & 0xffc0) === 0xfe80)
            return true; // fe80::/10
        if ((firstBlock & 0xff00) === 0xff00)
            return true; // ff00::/8
    }
    return false;
}
async function resolvePublicAddresses(hostname) {
    const ipVersion = (0, node_net_1.isIP)(hostname);
    if (ipVersion) {
        if (isPrivateIp(hostname)) {
            throw new Error('URL privada não é permitida.');
        }
        return [{ address: hostname, family: ipVersion }];
    }
    const records = await (0, promises_1.lookup)(hostname, { all: true, verbatim: true });
    if (records.length === 0 || records.some((record) => isPrivateIp(record.address))) {
        throw new Error('URL privada não é permitida.');
    }
    return records;
}
async function assertPublicHttpUrl(rawUrl) {
    let parsed;
    try {
        parsed = new URL(rawUrl);
    }
    catch {
        throw new Error('URL inválida.');
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('Use uma URL HTTP ou HTTPS válida.');
    }
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
        throw new Error('URL local não é permitida.');
    }
    await resolvePublicAddresses(hostname);
    return parsed;
}
async function readResponseBodyWithLimit(response) {
    const chunks = [];
    let total = 0;
    for await (const chunk of response) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += buffer.byteLength;
        if (total > MAX_REMOTE_IMAGE_BYTES) {
            response.destroy();
            throw new Error('Imagem muito grande. Limite de 5 MB.');
        }
        chunks.push(buffer);
    }
    return Buffer.concat(chunks);
}
async function requestPublicRemoteImage(url) {
    const publicRecords = await resolvePublicAddresses(url.hostname);
    const selectedRecord = publicRecords[0];
    const requestPath = `${url.pathname}${url.search}` || '/';
    const requestHeaders = {
        accept: 'image/jpeg,image/png,image/webp',
        host: url.host,
        'user-agent': 'MesasRPGArtificio/1.0 image-import',
    };
    return new Promise((resolve, reject) => {
        // DNS is revalidated immediately before this request, and the connection
        // uses the already validated public address to avoid DNS rebinding.
        const requestOptions = {
            hostname: selectedRecord.address,
            port: url.port ? Number(url.port) : undefined,
            path: requestPath,
            timeout: REMOTE_IMAGE_TIMEOUT_MS,
            headers: requestHeaders,
        };
        const request = url.protocol === 'https:'
            ? node_https_1.default.get({ ...requestOptions, servername: url.hostname }, resolve)
            : node_http_1.default.get(requestOptions, resolve);
        request.on('timeout', () => {
            request.destroy(new Error('Tempo esgotado ao baixar a imagem.'));
        });
        request.on('error', reject);
    });
}
async function fetchPublicRemoteImage(initialUrl) {
    let currentUrl = initialUrl;
    for (let redirectCount = 0; redirectCount <= MAX_REMOTE_IMAGE_REDIRECTS; redirectCount += 1) {
        const response = await requestPublicRemoteImage(currentUrl);
        const statusCode = response.statusCode ?? 0;
        if (statusCode < 300 || statusCode >= 400) {
            return response;
        }
        response.resume();
        const location = response.headers.location;
        if (!location) {
            throw new Error('Redirecionamento de imagem sem destino válido.');
        }
        currentUrl = await assertPublicHttpUrl(new URL(location, currentUrl).toString());
    }
    throw new Error('O link da imagem redireciona muitas vezes.');
}
async function uploadRemoteImageToCloudinary(rawUrl) {
    const parsedUrl = await assertPublicHttpUrl(rawUrl);
    const response = await fetchPublicRemoteImage(parsedUrl);
    const statusCode = response.statusCode ?? 0;
    if (statusCode < 200 || statusCode >= 300) {
        throw new Error('Não foi possível baixar a imagem desse link.');
    }
    const contentType = response.headers['content-type']?.split(';')[0]?.toLowerCase() ?? '';
    if (!ALLOWED_REMOTE_MIME_TYPES.has(contentType)) {
        throw new Error('O link informado não aponta para uma imagem JPG, PNG ou WEBP.');
    }
    const contentLength = Number(response.headers['content-length'] ?? '0');
    if (contentLength > MAX_REMOTE_IMAGE_BYTES) {
        throw new Error('Imagem muito grande. Limite de 5 MB.');
    }
    const buffer = await readResponseBodyWithLimit(response);
    const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;
    return uploadImageToCloudinary(dataUri);
}
