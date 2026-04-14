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

interface CropData {
  crop_x: number;
  crop_y: number;
  crop_width: number;
  crop_height: number;
  original_width: number;
  original_height: number;
}

export async function uploadImageToCloudinary(imageUrl: string, cropData?: CropData) {
  try {
    const transformations = [];

    if (cropData) {
      const scaleX = 1200 / cropData.original_width;
      const scaleY = 650 / cropData.original_height;
      
      transformations.push({
        crop: 'crop',
        gravity: 'face',
        width: Math.round(cropData.crop_width * scaleX),
        height: Math.round(cropData.crop_height * scaleY),
        x: Math.round(cropData.crop_x * scaleX),
        y: Math.round(cropData.crop_y * scaleY),
      });
    } else {
      transformations.push({ width: 1200, height: 650, crop: 'fill' });
    }

    transformations.push({ quality: 'auto', fetch_format: 'auto' });

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