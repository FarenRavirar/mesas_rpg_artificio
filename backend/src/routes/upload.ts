import express from 'express';
import multer from 'multer';
import { uploadImageToCloudinary } from '../services/cloudinary';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

interface CropData {
  crop_x: number;
  crop_y: number;
  crop_width: number;
  crop_height: number;
  original_width: number;
  original_height: number;
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;

    let cropData: CropData | undefined;
    if (req.body.crop_x !== undefined) {
      cropData = {
        crop_x: parseInt(req.body.crop_x, 10),
        crop_y: parseInt(req.body.crop_y, 10),
        crop_width: parseInt(req.body.crop_width, 10),
        crop_height: parseInt(req.body.crop_height, 10),
        original_width: parseInt(req.body.original_width, 10),
        original_height: parseInt(req.body.original_height, 10),
      };
    }

    const result = await uploadImageToCloudinary(dataUri, cropData);
    
    res.json({ 
      secure_url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error: any) {
    console.error('[upload] Erro ao fazer upload:', error?.message || error);
    res.status(500).json({ error: 'Falha ao processar imagem' });
  }
});

export default router;