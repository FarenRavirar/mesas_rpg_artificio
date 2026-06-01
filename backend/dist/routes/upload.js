"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("../services/cloudinary");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
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
router.post('/upload', auth_1.authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'Nenhum arquivo enviado' });
            return;
        }
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${b64}`;
        const result = await (0, cloudinary_1.uploadImageToCloudinary)(dataUri);
        res.json({
            secure_url: result.secure_url,
            public_id: result.public_id
        });
    }
    catch (error) {
        console.error('[upload] Erro ao fazer upload:', error?.message || error);
        if (error instanceof multer_1.default.MulterError && error.code === 'LIMIT_FILE_SIZE') {
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
router.post('/upload/url', auth_1.authMiddleware, async (req, res) => {
    try {
        const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
        const purpose = typeof req.body?.purpose === 'string' ? req.body.purpose : 'table_banner';
        if (!url) {
            res.status(400).json({ error: 'Informe a URL da imagem.' });
            return;
        }
        if (!['table_banner', 'profile_avatar', 'profile_banner'].includes(purpose)) {
            res.status(400).json({ error: 'Finalidade de imagem inválida.' });
            return;
        }
        const result = await (0, cloudinary_1.uploadRemoteImageToCloudinary)(url);
        res.json({
            secure_url: result.secure_url,
            public_id: result.public_id,
        });
    }
    catch (error) {
        console.error('[upload:url] Erro ao importar imagem:', error?.message || error);
        res.status(400).json({
            error: error?.message || 'Não foi possível importar a imagem desse link.',
        });
    }
});
exports.default = router;
