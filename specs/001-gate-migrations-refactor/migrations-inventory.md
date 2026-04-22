# Inventário de Migrations

| Caminho Atual | Número | Descrição | Classificação Sugerida |
|---|---|---|---|
| `./backend/migrations/migration_11_candidate_audit_log.sql` | 11 | candidate audit log | online-safe |
| `./backend/migrations/migration_17_update_log.sql` | 17 | update log | online-safe |
| `./backend/src/db/migrations/migration_06_rename_gm_bio.sql` | 06 | rename gm bio | manual-risk |
| `./backend/src/db/migrations/migration_07_table_metric_events.sql` | 07 | table metric events | online-safe |
| `./backend/src/migrations/migration_06_parser_fields.sql` | 06 | parser fields | online-safe |
| `./backend/src/migrations/migration_07_advanced_parser.sql` | 07 | advanced parser | online-safe |
| `./backend/src/migrations/migration_11_advanced_fields.sql` | 11 | advanced fields | online-safe |
| `./backend/src/migrations/migration_12_table_schedules.sql` | 12 | table schedules | online-safe |
| `./backend/src/migrations/migration_17_setting_and_styles.sql` | 17 | setting and styles | online-safe |
| `./backend/src/migrations/migration_18_editorial_fields.sql` | 18 | editorial fields | online-safe |
| `./database/migration_01_base_schema.sql` | 01 | base schema | online-safe |
| `./database/migration_02_system_taxonomy_and_ddal.sql` | 02 | system taxonomy and ddal | online-safe |
| `./database/migration_03_gm_profile_nickname.sql` | 03 | gm profile nickname | online-safe |
| `./database/migration_04_publisher_role_and_contacts.sql` | 04 | publisher role and contacts | online-safe |
| `./database/migration_05_aggregator_sources_and_queue.sql` | 05 | aggregator sources and queue | online-safe |
| `./database/migration_06_system_suggestions.sql` | 06 | system suggestions | online-safe |
| `./database/migration_08_external_gm.sql` | 08 | external gm | online-safe |
| `./database/migration_09_table_frequency_rules_banner.sql` | 09 | table frequency rules banner | online-safe |
| `./database/migration_10_covil_and_expiration.sql` | 10 | covil and expiration | online-safe |
| `./database/migration_11_sistemas_json.sql` | 11 | sistemas json | online-safe |
| `./database/migration_12_cenarios.sql` | 12 | cenarios | online-safe |
| `./database/migration_14_user_profiles_complete.sql` | 14 | user profiles complete | online-safe |
| `./database/migration_15_user_links.sql` | 15 | user links | online-safe |
| `./database/migration_16_table_metrics.sql` | 16 | table metrics | online-safe |
| `./database/migration_18_drop_imgur_legacy.sql` | 18 | drop imgur legacy | manual-risk |
| `./database/migration_99_drop_aggregator_tables.sql` | 99 | drop aggregator tables | manual-risk |
| `./database/migration_100_add_slots_open.sql` | 100 | add slots open | online-safe |
| `./database/migration_101_add_banner_crop_data.sql` | 101 | add banner crop data | online-safe |
| `./database/migration_102_add_name_pt.sql` | 102 | add name pt | online-safe |
| `./database/migration_103_scenario_suggestions.sql` | 103 | scenario suggestions | online-safe |
| `./database/migration_104_drop_tables_frequency_columns.sql` | 104 | drop tables frequency columns | manual-risk |
| `./database/migration_104_unify_node_type_check.sql` | 104 | unify node type check | online-safe |
| `./database/migration_105_communication_platforms.sql` | 105 | communication platforms | online-safe |
| `./database/migration_105_system_suggestions_align.sql` | 105 | system suggestions align | online-safe |
| `./database/migration_106_notifications_action_metadata.sql` | 106 | notifications action metadata | online-safe |
| `./database/migration_106_vtt_logo_filenames.sql` | 106 | vtt logo filenames | online-safe |
| `./database/migration_107_gm_public_profile_v2.sql` | 107 | gm public profile v2 | online-safe |
| `./database/migration_107_scenarios_aliases_fields.sql` | 107 | scenarios aliases fields | online-safe |
| `./database/migration_108_activity_log.sql` | 108 | activity log | online-safe |
| `./database/migration_108_gm_profile_metrics.sql` | 108 | gm profile metrics | online-safe |
| `./database/migration_108_systems_logo_website.sql` | 108 | systems logo website | online-safe |
| `./database/migration_109_links_og_metadata_cache.sql` | 109 | links og metadata cache | online-safe |
| `./database/migration_111_gm_preferred_vtt_platforms.sql` | 111 | gm preferred vtt platforms | online-safe |
| `./database/migration_112_gm_contact_info.sql` | 112 | gm contact info | online-safe |
| `./database/migration_113_benchmark_snapshots.sql` | 113 | benchmark snapshots | online-safe |

**Notas:**
- Aquelas com nomes contendo `drop` ou `rename` foram sugeridas como `manual-risk`. As demais como `online-safe`.
- Existem duplicidades de numeração e arquivos órfãos (ex: vários arquivos usando '06', '07', '11' em diretórios diferentes, e dois '104' e '105' no database). Na fase 5, os migrations órfãos serão movidos e renomeados para acomodar numeração correta.
