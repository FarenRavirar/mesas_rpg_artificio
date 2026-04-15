import { v2 as cloudinary } from 'cloudinary';

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