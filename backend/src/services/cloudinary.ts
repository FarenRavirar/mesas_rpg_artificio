import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageToCloudinary(imageUrl: string) {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: 'mesas_rpg',
    transformation: [
      { width: 1200, height: 400, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' }
    ]
  });
  
  return {
    secure_url: result.secure_url,
    public_id: result.public_id
  };
}