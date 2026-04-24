import { Router, Request, Response } from 'express';
import { db } from '../db';
import { prodDb } from '../db/prod';
import { authMiddleware } from '../middleware/auth';
import { sql } from 'kysely';

const router = Router();

// T004: Middleware de proteção
// T005: Safety gate de ambiente
router.post('/sync/hydrate', authMiddleware, async (req: Request, res: Response) => {
  const userRole = (req as any).user?.role;
  
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  }

  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'ABORT: Execução bloqueada em ambiente de produção.' });
  }

  const dryRun = req.query.dry_run === 'true';
  const logs: any[] = [];

  try {
    // T006: Transação única
    await db.transaction().execute(async (trx) => {
      
      // T008: Ordem topológica de FKs
      const tablesToSync = [
        // Raízes
        'systems', 'scenarios', 'platforms', 'tags', 'vtt_platforms', 'communication_platforms', 'sources',
        // Extensões
        'scenario_aliases', 'scenario_suggestions', 'system_aliases', 'system_suggestions', 'vtt_platform_suggestions', 'setting_style_suggestions',
        // Identidade
        'users',
        // Dependentes diretos
        'auth_providers', 'profiles', 'player_profiles', 'gm_profiles', 'user_preferences', 'user_links', 'user_systems',
        // Negócio
        'tables',
        // Agregados
        'table_contacts', 'table_platforms', 'table_schedules', 'table_tags', 'table_history', 'imported_tables', 'table_metrics', 'gm_profile_metrics',
        // Interativos
        'bookmarks', 'table_interests', 'questions', 'reviews',
        // Folhas
        'answers'
      ] as const;

      for (const tableName of tablesToSync) {
        // Obter registros de Prod
        const prodRecords = await prodDb.selectFrom(tableName as any).selectAll().execute();
        
        // T010: Contadores
        let candidates = prodRecords.length;
        let inserted = 0;
        let updated = 0;
        let ignored = 0;

        for (const record of prodRecords) {
          try {
            // T009: Tratamento de PII e exclusão de colunas
            const safeRecord = { ...record };

            if (tableName === 'users') {
              safeRecord.email = `fake_${record.id}@example.com`;
              safeRecord.google_id = `fake_${record.id}`;
              safeRecord.refresh_token = null;
              safeRecord.location = null;
            }
            if (tableName === 'auth_providers') {
              safeRecord.provider_user_id = `fake_${record.id}`;
              safeRecord.provider_data = null;
            }
            if (tableName === 'gm_profiles') {
              safeRecord.discord_id = null;
              safeRecord.discord_username = null;
              safeRecord.contact_methods = null;
              delete safeRecord.avatar_deletehash;
              delete safeRecord.avatar_imgur_id;
              delete safeRecord.banner_deletehash;
              delete safeRecord.banner_imgur_id;
            }
            if (tableName === 'tables') {
              delete safeRecord.cover_deletehash;
              delete safeRecord.cover_imgur_id;
            }
            if (tableName === 'table_contacts') {
              safeRecord.discord_server_url = 'https://discord.gg/dummy';
              safeRecord.value = 'dummy_contact';
            }
            if (tableName === 'profiles') {
              safeRecord.display_name = `User_${record.id}`;
              safeRecord.avatar_url = null;
            }
            if (tableName === 'user_links') {
              safeRecord.url = 'https://dummy.link';
            }

            // Busca no DB local (Beta) para checar se existe e comparar
            const existingRecord = await trx.selectFrom(tableName as any)
              .selectAll()
              .where('id', '=', record.id)
              .executeTakeFirst();

            if (!existingRecord) {
              // INSERT
              await trx.insertInto(tableName as any).values(safeRecord).execute();
              inserted++;
            } else {
              // UPDATE (só se diferente)
              // Comparação básica JSON
              const isEqual = JSON.stringify(existingRecord) === JSON.stringify(safeRecord);
              if (!isEqual) {
                await trx.updateTable(tableName as any)
                  .set(safeRecord)
                  .where('id', '=', record.id)
                  .execute();
                updated++;
              } else {
                ignored++;
              }
            }
          } catch (e: any) {
            // T009/spec: Se der erro de FK por estar órfão, apenas ignora
            if (e.code === '23503') { // foreign_key_violation
              ignored++;
            } else {
              throw e;
            }
          }
        }

        logs.push({
          table: tableName,
          candidates,
          inserted,
          updated,
          ignored
        });
      }

      if (dryRun) {
        // T007: Rollback for dry_run
        throw new Error('DRY_RUN_ROLLBACK');
      }
    });

    // T011: Retornar payload
    return res.json({ success: true, dry_run: dryRun, data: { tables: logs } });

  } catch (error: any) {
    if (error.message === 'DRY_RUN_ROLLBACK') {
      return res.json({ success: true, dry_run: true, data: { tables: logs } });
    }
    console.error('[Hydration]', error);
    return res.status(500).json({ error: 'Erro durante a hidratação' });
  }
});

export default router;
