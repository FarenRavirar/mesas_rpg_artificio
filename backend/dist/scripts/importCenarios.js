"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../db");
// =============================================================================
// UTILITÁRIOS
// =============================================================================
const slugify = (value) => {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
};
const parseSubgenres = (subgenero) => {
    if (!subgenero || subgenero.trim().length === 0) {
        return [];
    }
    return subgenero
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
};
// =============================================================================
// LÓGICA DE IMPORTAÇÃO
// =============================================================================
const importScenarios = async () => {
    console.log('[import-cenarios] Iniciando importação de cenarios.json...');
    // Ler arquivo JSON
    const jsonPath = path_1.default.resolve(__dirname, '../../cenarios.json');
    if (!fs_1.default.existsSync(jsonPath)) {
        throw new Error(`Arquivo não encontrado: ${jsonPath}`);
    }
    const jsonContent = fs_1.default.readFileSync(jsonPath, 'utf8');
    const scenarios = JSON.parse(jsonContent);
    console.log(`[import-cenarios] ${scenarios.length} cenários encontrados no JSON.`);
    let inserted = 0;
    let skipped = 0;
    await db_1.db.transaction().execute(async (trx) => {
        for (const scenario of scenarios) {
            if (!scenario.nome || scenario.nome.trim().length === 0) {
                skipped++;
                continue;
            }
            const name = scenario.nome.trim();
            const slug = slugify(name);
            const subgenres = parseSubgenres(scenario.subgenero);
            if (!slug) {
                console.warn(`[import-cenarios] Slug vazio para cenário: ${name}`);
                skipped++;
                continue;
            }
            const result = await trx
                .insertInto('scenarios')
                .values({
                name,
                slug,
                subgenres,
            })
                .onConflict((oc) => oc.column('slug').doNothing())
                .returning(['id'])
                .executeTakeFirst();
            if (result?.id) {
                inserted++;
            }
            else {
                skipped++;
            }
        }
    });
    console.log('[import-cenarios] Importação concluída com sucesso!');
    console.log(`- Cenários inseridos: ${inserted}`);
    console.log(`- Cenários ignorados (duplicados ou inválidos): ${skipped}`);
    await db_1.db.destroy();
};
// =============================================================================
// EXECUÇÃO
// =============================================================================
importScenarios().catch(async (error) => {
    console.error('[import-cenarios] Erro durante importação:', error);
    await db_1.db.destroy();
    process.exit(1);
});
