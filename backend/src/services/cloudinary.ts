import { v2 as cloudinary } from 'cloudinary';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('[cloudinary] Config loaded:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'set' : 'MISSING',
  api_key: process.env.CLOUDINARY_API_KEY ? 'set' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'set' : 'MISSING',
});

export async function uploadImageToCloudinary(imageUrl: string) {
  try {
    const transformations = [
      { width: 1200, height: 650, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ];

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: 'mesas_rpg',
      transformation: transformations
    });
    
    return {
      secure_url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error: any) {
    console.error('[cloudinary] Upload failed:', error?.message || error);
    throw error;
  }
}

const MAX_REMOTE_IMAGE_BYTES = 5 * 1024 * 1024;
const REMOTE_IMAGE_TIMEOUT_MS = 10000;
const ALLOWED_REMOTE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isPrivateIp(address: string): boolean {
  if (address.startsWith('10.')) return true;
  if (address.startsWith('127.')) return true;
  if (address.startsWith('169.254.')) return true;
  if (address.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(address)) return true;
  if (address === '::1') return true;
  if (address.toLowerCase().startsWith('fc') || address.toLowerCase().startsWith('fd')) return true;
  if (address.toLowerCase().startsWith('fe80')) return true;
  return false;
}

async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('URL inválida.');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Use uma URL HTTP ou HTTPS válida.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('URL local não é permitida.');
  }

  if (isIP(hostname) && isPrivateIp(hostname)) {
    throw new Error('URL privada não é permitida.');
  }

  const records = await lookup(hostname, { all: true });
  if (records.some((record) => isPrivateIp(record.address))) {
    throw new Error('URL privada não é permitida.');
  }

  return parsed;
}

async function readResponseBodyWithLimit(response: Response): Promise<Buffer> {
  if (!response.body) {
    throw new Error('Resposta sem conteúdo de imagem.');
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > MAX_REMOTE_IMAGE_BYTES) {
      await reader.cancel();
      throw new Error('Imagem muito grande. Limite de 5 MB.');
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

export async function uploadRemoteImageToCloudinary(rawUrl: string) {
  const parsedUrl = await assertPublicHttpUrl(rawUrl);

  const response = await fetch(parsedUrl, {
    redirect: 'follow',
    signal: AbortSignal.timeout(REMOTE_IMAGE_TIMEOUT_MS),
    headers: {
      accept: 'image/jpeg,image/png,image/webp',
      'user-agent': 'MesasRPGArtificio/1.0 image-import',
    },
  });

  if (!response.ok) {
    throw new Error('Não foi possível baixar a imagem desse link.');
  }

  const contentType = response.headers.get('content-type')?.split(';')[0]?.toLowerCase() ?? '';
  if (!ALLOWED_REMOTE_MIME_TYPES.has(contentType)) {
    throw new Error('O link informado não aponta para uma imagem JPG, PNG ou WEBP.');
  }

  const contentLength = Number(response.headers.get('content-length') ?? '0');
  if (contentLength > MAX_REMOTE_IMAGE_BYTES) {
    throw new Error('Imagem muito grande. Limite de 5 MB.');
  }

  const buffer = await readResponseBodyWithLimit(response);
  const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`;

  return uploadImageToCloudinary(dataUri);
}
