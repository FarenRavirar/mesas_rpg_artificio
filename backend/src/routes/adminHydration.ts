import { Router, Request, Response } from 'express';
import { db } from '../db';
import { prodDb } from '../db/prod';
import { authMiddleware } from '../middleware/auth';
import { sql } from 'kysely';

const SYNC_FIELDS: Record<string, string[]> = {
  users: ['id', 'google_id', 'email', 'username', 'location', 'role', 'refresh_token', 'privacy_public', 'created_at', 'updated_at'],
  auth_providers: ['id', 'user_id', 'provider', 'provider_user_id', 'provider_data', 'created_at'],
  profiles: ['id', 'user_id', 'display_name', 'bio', 'avatar_url', 'languages', 'tags', 'created_at', 'updated_at'],
  player_profiles: ['user_id', 'experience_level', 'playstyle', 'preferred_days', 'preferred_time', 'pricing_preference', 'updated_at'],
  gm_profiles: ['id', 'user_id', 'slug', 'nickname', 'bio_long', 'avatar_url', 'banner_url', 'languages', 'specialties', 'badges', 'tables_count', 'avg_rating', 'reviews_count', 'discord_connected', 'discord_username', 'discord_id', 'covil_verified', 'covil_verified_at', 'covil_verified_by', 'experience_years', 'average_price', 'gm_style', 'tools', 'game_format', 'tagline', 'promo_badge_text', 'selling_points', 'closed_group_enabled', 'closed_group_systems', 'closed_group_description', 'closed_group_min_price_cents', 'preferred_vtt_platforms', 'contact_methods', 'created_at', 'updated_at'],
  user_preferences: ['id', 'user_id', 'systems', 'tags', 'languages', 'platforms', 'weekdays', 'created_at', 'updated_at'],
  user_links: ['id', 'user_id', 'url', 'type', 'title', 'description', 'embed_url', 'thumbnail_url', 'metadata_status', 'metadata_fetched_at', 'metadata_last_accessed_at', 'metadata_fail_count', 'metadata_next_retry_at', 'sort_order', 'created_at', 'updated_at'],
  user_systems: ['id', 'user_id', 'system_id', 'type', 'created_at'],
  tables: ['id', 'slug', 'gm_id', 'system_id', 'scenario_id', 'custom_scenario', 'title', 'description', 'cover_url', 'status', 'type', 'audience', 'age_rating', 'modality', 'vtt_platform_id', 'game_platform_custom', 'game_platform_legacy', 'game_platform', 'communication_platform_id', 'communication_platform', 'price_type', 'price_value', 'price_frequency', 'slots_total', 'slots_filled', 'slots_open', 'language', 'experience_level', 'table_level', 'starts_at', 'city', 'state', 'content_warnings', 'safety_tools', 'source_url', 'source_id', 'origin', 'featured', 'publisher_role', 'actual_gm_name', 'is_ddal', 'ddal_code', 'ddal_name', 'ddal_tier', 'ddal_season', 'ddal_duration', 'ddal_format', 'ddal_org_code', 'ddal_setting', 'ddal_rules_notes', 'is_covil', 'imported_expires_at', 'rules_notes', 'banner_url', 'banner_crop_data', 'master_display_name', 'campaign_length', 'level_range', 'billing_text', 'session_zero_free', 'synopsis', 'style_text', 'listing_excerpt', 'technical_requirements', 'requires_pc', 'requires_camera', 'requires_microphone', 'setting_name', 'setting_styles', 'style_tags', 'synopsis_narrative', 'benefits_text', 'features', 'table_gm_bio', 'created_at', 'updated_at'],
  table_contacts: ['id', 'table_id', 'channel', 'value', 'label', 'discord_server_url', 'sort_order', 'created_at'],
  table_schedules: ['id', 'table_id', 'day_of_week', 'start_time', 'end_time', 'frequency', 'slots_per_session', 'is_ongoing', 'notes', 'sort_order', 'created_at'],
  table_metrics: ['id', 'table_id', 'views_count', 'clicks_count', 'contacts_count', 'favorites_count', 'created_at', 'updated_at'],
  gm_profile_metrics: ['id', 'gm_profile_id', 'views_count', 'created_at', 'updated_at'],
  systems: ['id', 'name', 'name_pt', 'slug', 'description', 'parent_id', 'node_type', 'depth', 'path_slug', 'logo_filename', 'website_url', 'created_at'],
  system_aliases: ['id', 'system_id', 'alias', 'alias_slug', 'is_official', 'created_at'],
  system_suggestions: ['id', 'user_id', 'name', 'name_pt', 'node_type', 'parent_id', 'description', 'aliases', 'status', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'user_notified', 'created_at', 'updated_at'],
  tags: ['id', 'name', 'slug', 'created_at'],
  platforms: ['id', 'name', 'slug', 'created_at'],
  scenarios: ['id', 'name', 'name_pt', 'slug', 'description', 'subgenres', 'created_at'],
  scenario_aliases: ['id', 'scenario_id', 'alias', 'alias_slug', 'is_official', 'created_at'],
  scenario_suggestions: ['id', 'user_id', 'name', 'name_pt', 'description', 'aliases', 'subgenres', 'status', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'user_notified', 'created_at', 'updated_at'],
  vtt_platforms: ['id', 'name', 'slug', 'logo_filename', 'website_url', 'is_active', 'sort_order', 'created_at', 'updated_at'],
  vtt_platform_suggestions: ['id', 'suggested_name', 'suggested_by_user_id', 'table_id', 'status', 'admin_notes', 'created_at', 'reviewed_at', 'reviewed_by_user_id'],
  communication_platforms: ['id', 'name', 'slug', 'website_url', 'is_active', 'sort_order', 'created_at', 'updated_at'],
  setting_style_suggestions: ['id', 'setting_name', 'suggested_styles', 'created_at', 'updated_at'],
};

const router = Router();

// T004: Middleware de proteção
// T005: Safety gate de ambiente
router.post('/sync/hydrate', authMiddleware, async (req: Request, res: Response) => {
  const userRole = (req as any).user?.role;
  const userId = (req as any).user?.id;
  
  if (!userId || userRole !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores.' });
  }

  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase();
  if (nodeEnv === 'production' || nodeEnv === 'prod') {
    return res.status(403).json({ error: 'ABORT: Execução bloqueada em ambiente de produção.' });
  }

  const dryRun = req.query.dry_run === 'true';
  const logs: any[] = [];

  try {
    await prodDb.selectFrom('users').select('id').limit(1).execute();
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
            const rawSafeRecord = { ...record };

            if (tableName === 'users') {
              rawSafeRecord.email = `fake_${record.id}@example.com`;
              rawSafeRecord.google_id = `fake_${record.id}`;
              rawSafeRecord.refresh_token = null;
              rawSafeRecord.location = null;
            }
            if (tableName === 'auth_providers') {
              rawSafeRecord.provider_user_id = `fake_${record.id}`;
              rawSafeRecord.provider_data = null;
            }
            if (tableName === 'gm_profiles') {
              rawSafeRecord.discord_id = null;
              rawSafeRecord.discord_username = null;
              rawSafeRecord.contact_methods = null;
            }
            if (tableName === 'table_contacts') {
              rawSafeRecord.discord_server_url = 'https://discord.gg/dummy';
              rawSafeRecord.value = 'dummy_contact';
            }
            if (tableName === 'profiles') {
              rawSafeRecord.display_name = `User_${record.id}`;
              rawSafeRecord.avatar_url = null;
            }
            if (tableName === 'user_links') {
              rawSafeRecord.url = 'https://dummy.link';
            }

            const allowedFields = SYNC_FIELDS[tableName];
            if (!allowedFields) {
              console.warn(`[Hydration] Tabela ${tableName} sem allowlist definida — pulando`);
              continue;
            }
            const safeRecord = Object.fromEntries(
              Object.entries(rawSafeRecord).filter(([key]) => allowedFields.includes(key))
            );

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
              // Comparação básica JSON com ordering
              const sortedExisting = JSON.stringify(existingRecord, Object.keys(existingRecord).sort());
              const sortedSafe = JSON.stringify(safeRecord, Object.keys(safeRecord).sort());
              const isEqual = sortedExisting === sortedSafe;
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
              console.warn(`[Hydration] FK violation: tabela=${tableName} id=${record.id}`, {
                error: e.message,
                detail: e.detail,
                constraint: e.constraint
              });
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
