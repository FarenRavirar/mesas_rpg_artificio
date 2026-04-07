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
// =============================================================================
// LÓGICA DE IMPORTAÇÃO
// =============================================================================
const importSystems = async () => {
    console.log('[import-sistemas] Iniciando importação de sistemas.json...');
    // Ler arquivo JSON
    const jsonPath = path_1.default.resolve(__dirname, '../../sistemas.json');
    if (!fs_1.default.existsSync(jsonPath)) {
        throw new Error(`Arquivo não encontrado: ${jsonPath}`);
    }
    const jsonContent = fs_1.default.readFileSync(jsonPath, 'utf8');
    const systems = JSON.parse(jsonContent);
    console.log(`[import-sistemas] ${systems.length} sistemas encontrados no JSON.`);
    let systemsInserted = 0;
    let editionsInserted = 0;
    let variantsInserted = 0;
    let aliasesInserted = 0;
    await db_1.db.transaction().execute(async (trx) => {
        for (const sys of systems) {
            // 1. INSERIR SISTEMA BASE
            const baseSlug = slugify(sys.name);
            const pathSlug = baseSlug;
            const base = await trx
                .insertInto('systems')
                .values({
                name: sys.name,
                slug: baseSlug,
                node_type: 'system',
                depth: 0,
                path_slug: pathSlug,
                parent_id: null,
            })
                .onConflict((oc) => oc.column('slug').doNothing())
                .returning(['id'])
                .executeTakeFirst();
            if (!base) {
                console.warn(`[import-sistemas] Falha ao inserir sistema base: ${sys.name}`);
                continue;
            }
            systemsInserted++;
            // 2. INSERIR ALIASES
            for (const alias of sys.aliases) {
                if (!alias || alias.trim().length === 0)
                    continue;
                const aliasSlug = slugify(alias);
                if (!aliasSlug)
                    continue;
                const insertedAlias = await trx
                    .insertInto('system_aliases')
                    .values({
                    system_id: base.id,
                    alias: alias.trim(),
                    alias_slug: aliasSlug,
                    is_official: false, // Pode ser refinado depois
                })
                    .onConflict((oc) => oc.columns(['system_id', 'alias_slug']).doNothing())
                    .returning(['id'])
                    .executeTakeFirst();
                if (insertedAlias?.id)
                    aliasesInserted++;
            }
            // 3. INSERIR EDIÇÕES
            if (sys.editions.length > 0) {
                for (const edition of sys.editions) {
                    if (!edition || edition.trim().length === 0)
                        continue;
                    const edSlug = slugify(edition);
                    const edPathSlug = `${baseSlug}/${edSlug}`;
                    const edName = `${sys.name} ${edition}`;
                    const ed = await trx
                        .insertInto('systems')
                        .values({
                        name: edName,
                        slug: `${baseSlug}--${edSlug}`,
                        node_type: 'edition',
                        depth: 1,
                        path_slug: edPathSlug,
                        parent_id: base.id,
                    })
                        .onConflict((oc) => oc.column('slug').doNothing())
                        .returning(['id'])
                        .executeTakeFirst();
                    if (!ed) {
                        console.warn(`[import-sistemas] Falha ao inserir edição: ${edName}`);
                        continue;
                    }
                    editionsInserted++;
                    // 4. INSERIR VARIANTES (filhas da edição)
                    for (const variant of sys.variants) {
                        if (!variant || variant.trim().length === 0)
                            continue;
                        const varSlug = slugify(variant);
                        const varPathSlug = `${baseSlug}/${edSlug}/${varSlug}`;
                        const varName = `${sys.name} ${edition} ${variant}`;
                        await trx
                            .insertInto('systems')
                            .values({
                            name: varName,
                            slug: `${baseSlug}--${edSlug}--${varSlug}`,
                            node_type: 'variant',
                            depth: 2,
                            path_slug: varPathSlug,
                            parent_id: ed.id,
                        })
                            .onConflict((oc) => oc.column('slug').doNothing())
                            .execute();
                        variantsInserted++;
                    }
                }
            }
            else if (sys.variants.length > 0) {
                // 5. VARIANTES SEM EDIÇÃO (tratar como edições)
                for (const variant of sys.variants) {
                    if (!variant || variant.trim().length === 0)
                        continue;
                    const varSlug = slugify(variant);
                    const varPathSlug = `${baseSlug}/${varSlug}`;
                    const varName = `${sys.name} ${variant}`;
                    await trx
                        .insertInto('systems')
                        .values({
                        name: varName,
                        slug: `${baseSlug}--${varSlug}`,
                        node_type: 'edition',
                        depth: 1,
                        path_slug: varPathSlug,
                        parent_id: base.id,
                    })
                        .onConflict((oc) => oc.column('slug').doNothing())
                        .execute();
                    editionsInserted++;
                }
            }
        }
    });
    console.log('[import-sistemas] Importação concluída com sucesso!');
    console.log(`- Sistemas base inseridos: ${systemsInserted}`);
    console.log(`- Edições inseridas: ${editionsInserted}`);
    console.log(`- Variantes inseridas: ${variantsInserted}`);
    console.log(`- Aliases inseridos: ${aliasesInserted}`);
    await db_1.db.destroy();
};
// =============================================================================
// EXECUÇÃO
// =============================================================================
importSystems().catch(async (error) => {
    console.error('[import-sistemas] Erro durante importação:', error);
    await db_1.db.destroy();
    process.exit(1);
});
