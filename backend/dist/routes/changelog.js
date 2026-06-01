"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const router = (0, express_1.Router)();
// CORREÇÃO BE-01: Cache em memória para evitar leitura repetida do disco
let changelogsCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minuto
router.get('/', async (req, res) => {
    try {
        const now = Date.now();
        // Usar cache se ainda válido
        if (changelogsCache && (now - cacheTimestamp) < CACHE_TTL) {
            return res.json({ data: changelogsCache });
        }
        // CORREÇÃO INT-02: Path relativo mais robusto
        const changelogsPath = (0, path_1.join)(__dirname, '../..', 'database', 'changelogs.json');
        const changelogsData = await (0, promises_1.readFile)(changelogsPath, 'utf-8');
        // CORREÇÃO BE-02: Validar JSON antes de parsear
        let changelogs;
        try {
            changelogs = JSON.parse(changelogsData);
            if (!Array.isArray(changelogs)) {
                throw new Error('Changelogs deve ser um array');
            }
        }
        catch (parseError) {
            console.error('[GET /changelog] JSON inválido:', parseError.message);
            return res.status(500).json({ error: 'Erro ao processar atualizações.' });
        }
        // Filtrar apenas publicados e ordenar por data
        const published = changelogs
            .filter((log) => log.published && log.id && log.title && log.body)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 50);
        // Atualizar cache
        changelogsCache = published;
        cacheTimestamp = now;
        res.json({ data: published });
    }
    catch (error) {
        console.error('[GET /changelog] Erro:', {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
        });
        res.status(500).json({ error: 'Erro ao buscar atualizações.' });
    }
});
exports.default = router;
