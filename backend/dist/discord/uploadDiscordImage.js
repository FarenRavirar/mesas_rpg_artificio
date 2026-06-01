"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDiscordImageToCloudinary = uploadDiscordImageToCloudinary;
const node_crypto_1 = require("node:crypto");
const node_stream_1 = require("node:stream");
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
function categorizeFetchError(error) {
    if (error instanceof Error && /timeout|aborted|network|fetch failed/i.test(error.message)) {
        return 'network';
    }
    return 'network';
}
function uploadBufferToCloudinary(buffer, contentType, publicId) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({
            folder: 'discord-imports',
            public_id: publicId,
            resource_type: 'image',
            overwrite: false,
        }, (error, result) => {
            if (error) {
                reject(error);
                return;
            }
            if (!result?.secure_url || !result.public_id) {
                reject(new Error('Cloudinary não retornou URL da imagem.'));
                return;
            }
            resolve({ url: result.secure_url, public_id: result.public_id });
        });
        node_stream_1.Readable.from(buffer).pipe(stream);
    });
}
async function uploadDiscordImageToCloudinary(sourceUrl, deps = {}) {
    const fetchImpl = deps.fetchImpl ?? fetch;
    const uploadBuffer = deps.uploadBuffer ?? uploadBufferToCloudinary;
    let response;
    try {
        response = await fetchImpl(sourceUrl, { signal: AbortSignal.timeout(10000) });
    }
    catch (error) {
        return {
            status: categorizeFetchError(error),
            error: error instanceof Error ? error.message : 'Falha de rede ao baixar imagem Discord.',
        };
    }
    if (response.status === 404 || response.status === 410) {
        return { status: 'expired_url', error: `Discord CDN retornou HTTP ${response.status}.` };
    }
    if (!response.ok) {
        return { status: 'network', error: `Download da imagem Discord falhou com HTTP ${response.status}.` };
    }
    const contentType = response.headers.get('content-type')?.split(';')[0]?.toLowerCase() ?? '';
    if (!contentType.startsWith('image/') || contentType === 'image/svg+xml') {
        return { status: 'expired_url', error: `Conteúdo baixado não é imagem suportada: ${contentType || 'sem content-type'}.` };
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0) {
        return { status: 'expired_url', error: 'Discord CDN retornou imagem vazia.' };
    }
    const publicId = (0, node_crypto_1.createHash)('sha256').update(buffer).digest('hex');
    try {
        return { status: 'success', ...(await uploadBuffer(buffer, contentType, publicId)) };
    }
    catch (error) {
        return {
            status: 'cloudinary',
            error: error instanceof Error ? error.message : 'Falha ao enviar imagem para Cloudinary.',
        };
    }
}
