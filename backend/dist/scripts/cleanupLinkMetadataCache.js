"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
const kysely_1 = require("kysely");
async function cleanup() {
    console.log('[MetadataCleanup] Iniciando rotina de manutenção...');
    try {
        // 1. Limpeza por inatividade (> 30 dias sem acesso) - Libera espaço, remove layout rico
        const inativos = await db_1.db.updateTable('user_links')
            .set({
            metadata_status: 'stale',
            description: null,
            thumbnail_url: null,
            updated_at: (0, kysely_1.sql) `NOW()`
        })
            .where('metadata_status', 'in', ['success', 'failed'])
            .where('metadata_last_accessed_at', '<', (0, kysely_1.sql) `NOW() - INTERVAL '30 days'`)
            .executeTakeFirst();
        console.log(`[MetadataCleanup] ${inativos.numUpdatedRows.toString()} links inativos purgados (> 30 dias secos).`);
        // 2. Re-scrap contínuo (> 60 dias desde o fetch) - Atualiza metadados dos links ativos
        const obsoletos = await db_1.db.updateTable('user_links')
            .set({
            metadata_status: 'stale',
            updated_at: (0, kysely_1.sql) `NOW()`
        })
            .where('metadata_status', '=', 'success')
            .where('metadata_fetched_at', '<', (0, kysely_1.sql) `NOW() - INTERVAL '60 days'`)
            .executeTakeFirst();
        console.log(`[MetadataCleanup] ${obsoletos.numUpdatedRows.toString()} links marcados para revalidação (> 60 dias obsoletos).`);
    }
    catch (error) {
        console.error('[MetadataCleanup] Erro durante a limpeza:', error);
    }
    finally {
        process.exit(0);
    }
}
cleanup();
