import express from 'express';
import multer from 'multer';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new Error('Formato inválido. Envie apenas JPG, PNG ou WEBP.'));
      return;
    }

    cb(null, true);
  },
});

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
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
  } catch (error: any) {
    console.error('[upload] Erro ao fazer upload:', error?.message || error);

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Arquivo muito grande. Limite de 5 MB.' });
      return;
    }

    if (error?.message === 'Formato inválido. Envie apenas JPG, PNG ou WEBP.') {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Falha ao processar imagem' });
  }
});

export default router;