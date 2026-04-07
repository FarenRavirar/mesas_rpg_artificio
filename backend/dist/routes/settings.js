"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const kysely_1 = require("kysely");
const router = (0, express_1.Router)();
/**
 * GET /api/v1/settings/suggest-styles?setting=<nome>
 * Retorna estilos sugeridos para um cenário específico (busca fuzzy)
 */
router.get('/suggest-styles', async (req, res) => {
    try {
        const { setting } = req.query;
        // CORREÇÃO DT-01: Validar se o parâmetro setting está presente e não vazio
        if (!setting || typeof setting !== 'string' || setting.trim().length === 0) {
            return res.status(400).json({ error: 'Query parameter "setting" é obrigatório' });
        }
        const safeSetting = setting.trim();
        // CORREÇÃO DT-01: Validar comprimento mínimo para evitar buscas muito genéricas
        if (safeSetting.length < 2) {
            return res.json({ suggestions: [] });
        }
        // CORREÇÃO DT-04: Usar DISTINCT ON para evitar duplicatas por setting_name
        const suggestions = await db_1.db
            .selectFrom('setting_style_suggestions')
            .distinctOn('setting_name')
            .select(['setting_name', 'suggested_styles'])
            .where((eb) => eb((0, kysely_1.sql) `similarity(setting_name, ${safeSetting})`, '>=', (0, kysely_1.sql) `0.3`))
            .orderBy('setting_name')
            .orderBy((0, kysely_1.sql) `similarity(setting_name, ${safeSetting})`, 'desc')
            .limit(5)
            .execute();
        return res.json({ suggestions });
    }
    catch (error) {
        console.error('Erro ao buscar sugestões de estilos:', error);
        return res.status(500).json({ error: 'Erro ao buscar sugestões de estilos' });
    }
});
exports.default = router;
