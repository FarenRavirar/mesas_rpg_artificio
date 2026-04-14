import express from 'express';
import multer from 'multer';
import { uploadImageToCloudinary } from '../services/cloudinary';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;

    const result = await uploadImageToCloudinary(dataUri);
    
    res.json({ 
      secure_url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('[upload] Erro ao fazer upload:', error);
    res.status(500).json({ error: 'Falha ao processar imagem' });
  }
});

export default router;