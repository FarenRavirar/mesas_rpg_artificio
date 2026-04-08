# ambiente_atual_mesas.md

## purpose
Contexto consolidado do projeto `mesas_rpg_artificio` para continuidade de auditoria técnica em novos chats, sem repetir coleta já validada.

## local_paths
```yaml
repo_root: C:\projetos\mesas_rpg_artificio
workspace_root: C:\projetos
````

## repo_state_last_validated

```yaml
current_local_branch: dev
last_commit_validated: 98c8e2b
last_commit_message: "docs: registra solução E102 para erro getsockname SSH (#3)"
beta_actions_deploy_after_push: success
last_deploy_date: 2026-04-04T16:32Z
```

## files_validated

```yaml
compose:
  - docker-compose.beta.yml
  - docker-compose.prod.yml

dockerfiles:
  - backend/Dockerfile
  - frontend/Dockerfile

frontend:
  - frontend/nginx.conf

backend:
  - backend/src/server.ts
  - backend/src/routes/auth.ts
  - backend/src/db/index.ts

env:
  - .env.example

workflows:
  - .github/workflows/deploy-beta.yml
  - .github/workflows/deploy-production.yml
```

## compose_layout

```yaml
beta:
  app: mesas-beta-frontend
  api: mesas-beta-api
  db: mesas-beta-db
  volume_logical: pgdata_mesas_beta
  external_network: gerenciador_telegram_default
  app_port_local: not_exposed
  cloudflare_upstream: http://mesas-beta-frontend:80

prod:
  app: mesas-app
  api: mesas-api
  db: mesas-db
  volume_logical: pgdata_mesas_prod
  external_network: gerenciador_telegram_default
  expected_remote_path: /opt/mesas/
  expected_cloudflare_upstream: http://mesas-app:80
  deployed: false
```

## build_model

```yaml
backend:
  compose_context: .
  dockerfile: backend/Dockerfile
  runtime_base: node:22-alpine
  builder_base: node:22-alpine
  runtime_entrypoint: node dist/server.js
  runtime_native_packages:
    - vips-dev
    - fftw-dev
    - build-base
    - python3

frontend:
  compose_context: ./frontend
  dockerfile: Dockerfile
  builder_base: node:22-alpine
  runtime_base: nginx:alpine
  runtime_entrypoint: nginx -g "daemon off;"
```

## frontend_runtime

```yaml
nginx_root: /usr/share/nginx/html
api_proxy_prefix: /api/
api_upstream_env: API_UPSTREAM
spa_fallback: true
legacy_oauth_proxy_paths:
  - /auth/google
  - /auth/google/callback
```

## backend_runtime

```yaml
framework: express
dotenv: true
cors: true
json_body_parser: true

routes:
  - /api/v1/health
  - /api/v1/auth
  - /auth
  - /api/v1/me
  - /api/v1/tables
  - /api/v1/systems
  - /api/v1/gm
  - /api/v1/system-suggestions
  - /api/v1/admin/system-suggestions
  - /api/v1/notifications

health_behavior:
  checks_database_if_DATABASE_URL_present: true
  database_probe_table: users
```

## database_connection

```yaml
source_of_truth: DATABASE_URL
not_used_as_primary_connection_source:
  - DB_HOST
  - POSTGRES_USER
  - POSTGRES_PASSWORD
  - POSTGRES_DB
orm_stack:
  - pg
  - kysely
```

## auth_google

```yaml
backend_callback_env_key: GOOGLE_CALLBACK_URL
backend_frontend_redirect_env_key: FRONTEND_URL

callback_route_handlers:
  canonical_mount: /api/v1/auth
  legacy_mount: /auth
  route_inside_router:
    - /google
    - /google/callback

final_frontend_redirect_pattern: "{FRONTEND_URL}/auth/callback?token=...&isNew=..."
admin_email_bootstrap: paulohenriquercc@gmail.com
```

## env_templates_and_conflicts

env_example:

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=SUBSTITUIR_SENHA_FORTE
POSTGRES_DB=mesas_rpg
DATABASE_URL=postgresql://admin:SUBSTITUIR_SENHA_FORTE@mesas-beta-db:5432/mesas_rpg
GOOGLE_CALLBACK_URL=https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback
FRONTEND_URL=https://mesasbeta.artificiorpg.com
```

beta_compose_effective_values:

```yaml
APP_ENV: beta
GOOGLE_CALLBACK_URL: https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback
FRONTEND_URL: https://mesasbeta.artificiorpg.com
```

prod_compose_effective_values:

```yaml
APP_ENV: production
GOOGLE_CALLBACK_URL: https://mesas.artificiorpg.com/api/v1/auth/google/callback
FRONTEND_URL: https://mesas.artificiorpg.com
```

known_conflict:

```yaml
oauth_callback:
  repo_env_example: https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback
  compose_beta: https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback
  compose_prod: https://mesas.artificiorpg.com/api/v1/auth/google/callback
  remote_env_beta: https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback
  runtime_effective_beta: https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback
```

## deployment_beta

```yaml
workflow: .github/workflows/deploy-beta.yml
trigger_branch: dev
remote_path: /opt/mesas-beta/
rsync_excludes:
  - .git
  - node_modules
  - .env
concurrency_group: deploy-beta
cancel_in_progress: true
rebuild_mode: docker compose up -d --build --remove-orphans
forced_no_cache: false
forced_full_down: false
post_steps:
  - docker compose ps
  - docker compose logs --tail=30 mesas-beta-frontend
  - docker compose logs --tail=30 mesas-beta-api
  - docker image prune -f
```

deployment_beta_inference:

```yaml
- remote_env_persisted_outside_repo: true
- compose_can_override_remote_env: true
- build_cache_reuse_enabled_in_beta: true
- forced_full_stack_downtime_removed_from_beta_workflow: true
- rollback_strategy_validated: false
- concurrency_lock_validated: true
```

## deployment_production

```yaml
workflow: .github/workflows/deploy-production.yml
trigger_branch: main
remote_path: /opt/mesas/
rsync_excludes:
  - .git
  - node_modules
  - .env
concurrency_group: deploy-production
cancel_in_progress: false
rebuild_mode: docker compose up -d --build --remove-orphans
forced_no_cache: false
forced_full_down: false
post_steps:
  - docker compose ps
  - docker compose logs --tail=30 mesas-app
  - docker compose logs --tail=30 mesas-api
  - docker image prune -f
deployed: false
```

deployment_production_inference:

```yaml
- workflow_ready_for_first_publish: true
- remote_target_path_exists: true
- remote_target_path_current_state: only_env_file_present
- runtime_not_published_yet: true
- rollback_strategy_validated: false
- concurrency_lock_validated: true
```

## docker_build_cache_snapshot

```yaml
before_beta_workflow_fix:
  build_cache_size: 13.36GB
  reclaimable: 13.36GB

after_manual_prune:
  build_cache_size: 0B
  reclaimable: 0B

after_new_beta_deploy:
  build_cache_size: 258MB
  reclaimable: 258MB
```

## runtime_beta_validated

public_entrypoint:

```yaml
domain: mesasbeta.artificiorpg.com
cloudflare_upstream: http://mesas-beta-frontend:80
```

remote_paths:

```yaml
deploy_path: /opt/mesas-beta/
env_file: /opt/mesas-beta/.env
compose_file: /opt/mesas-beta/docker-compose.beta.yml
```

remote_env_selected:

```env
POSTGRES_USER=admin
POSTGRES_DB=mesas_rpg
DATABASE_URL=postgresql://admin:MesasRPG%232026!Xk9vPq@mesas-beta-db:5432/mesas_rpg
GOOGLE_CALLBACK_URL=https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback
FRONTEND_URL=https://mesasbeta.artificiorpg.com
```

container_env_effective:

```env
DATABASE_URL=postgresql://admin:MesasRPG%232026!Xk9vPq@mesas-beta-db:5432/mesas_rpg
APP_ENV=beta
GOOGLE_CALLBACK_URL=https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback
FRONTEND_URL=https://mesasbeta.artificiorpg.com
```

runtime_stack_state_last_seen:

```yaml
mesas-beta-frontend:
  port_mapping: none
  internal_port: 80/tcp
  status: running

mesas-beta-api:
  internal_port: 3000/tcp
  status: running

mesas-beta-db:
  internal_port: 5432/tcp
  status: running_healthy
```

healthcheck_public:

```json
{"status":"ok","environment":"beta","db":"connected","usersSampled":true}
```

oauth_redirect_runtime:

```yaml
request: https://mesasbeta.artificiorpg.com/api/v1/auth/google
observed_status: 302
observed_redirect_uri: https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback
runtime_consistent: true
```

api_logs_last_seen:

```text
Server is running on port 3000
Server is running on port 3000
```

## persistence_and_network

```yaml
external_network_validated: gerenciador_telegram_default
db_volume_real: mesas-beta_pgdata_mesas_beta
db_mounts:
  - volume mesas-beta_pgdata_mesas_beta /var/lib/postgresql/data
  - bind /docker-entrypoint-initdb.d/00_init.sql
  - bind /docker-entrypoint-initdb.d/01_base_schema.sql
```

## cloudflare_mapping_known

```yaml
beta_domain: mesasbeta.artificiorpg.com -> http://mesas-beta-frontend:80
prod_domain: mesas.artificiorpg.com -> http://mesas-app:80
```

## confirmed_facts

```yaml
- beta_stack_running: true
- beta_db_healthy: true
- beta_api_public_health_ok: true
- beta_db_connected: true
- beta_persistence_ok: true
- beta_oauth_runtime_ok: true
- beta_compose_overrides_remote_env: true
- beta_uses_external_network_gerenciador_telegram_default: true
- frontend_entrypoint_is_container_mesas_beta_app_via_cloudflare: true
- backend_database_connection_depends_on_DATABASE_URL: true
- repo_oauth_configuration_normalized_to_api_v1_callback: true
- deploy_beta_workflow_hardened_and_validated: true
- deploy_production_workflow_hardened_but_not_published: true
- docker_build_cache_reduced_from_13_36GB_to_258MB_after_workflow_change: true
- migration_05_aggregator_applied_to_beta: true  # 2026-04-04
- migration_06_system_suggestions_applied_to_beta: true  # 2026-04-04
- migration_07_notifications_applied_to_beta: true  # 2026-04-04
- migration_09_table_fields_applied_to_beta: true  # 2026-04-04 (frequency, rules_notes, banner_url)
- crud_sistemas_colaborativo_implemented: true
- notification_system_in_app_implemented: true
- jwt_expires_in_updated_to_7d: true  # 2026-04-04 (era 15m)
- auth_context_intelligent_validation_implemented: true  # 2026-04-04
- req_18_fluxo_revisao_candidatos_implemented: true  # 2026-04-05 (em_validacao)
- req_19_melhorias_ux_nielsen_phase_1_4_implemented: true  # 2026-04-05 (em_validacao)
- req_20_parser_python_banner_avatar_implemented: true  # 2026-04-05 (parser extrai banner_url de attachments e avatar_url de author)
- req_20_candidateToFormData_banner_gm_avatar_mapped: true  # 2026-04-05 (mapeamento frontend implementado)
- req_20_migration_10_covil_expiration_pending: true  # 2026-04-05 (is_covil + imported_expires_at — a aplicar no beta)
- python_runtime_available_in_backend_container: true  # python3 instalado via Dockerfile alpine packages
- jsonrepair_library_installed_frontend: true  # para normalização de JSON corrompido do DiscordChatExporter
```

## database_tables_beta

```yaml
core_tables:
  - users
  - profiles
  - gm_profiles
  - tables  # migration_09 (2026-04-04): adicionados frequency, frequency_custom, rules_notes, banner_url
            # migration_10 (pendente): is_covil BOOLEAN, imported_expires_at TIMESTAMPTZ
  - table_contacts
  - systems
  - system_aliases

collaborative_features:
  - system_suggestions  # migration_06 (2026-04-04)
  - notifications       # migration_07 (2026-04-04)

aggregator_tables:
  - aggregator_sources  # migration_05 (2026-04-04)
  - aggregator_imported_raw_messages
  - aggregator_import_candidates
  - aggregator_settings

pending_migrations:
  - migration_10: "is_covil BOOLEAN DEFAULT FALSE, imported_expires_at TIMESTAMPTZ"
```

## prod_status

```yaml
compose_read: true
workflow_read: true
remote_path_expected: /opt/mesas/
remote_path_current_state: only_env_file_present
remote_env_present: true
runtime_deployed: false
health_validated: false
oauth_validated: false
db_volume_validated: false
logs_validated: false
```

## not_audited_yet

```yaml
- first_mesas_production_deploy
- production_runtime_after_first_publish
- production_db_volume_after_first_publish
- production_healthcheck_after_first_publish
- production_oauth_after_first_publish
- backup_restore_strategy
- database_migration_strategy_beyond_init_mounts
- observability
- alerts
- zero_downtime_strategy
```

## key_risks

```yaml
- production_workflow_points_to_valid_path_but_environment_is_not_deployed_yet
```

## next_steps_high_value

```yaml
1: audit_9router_antigravity_and_daily_routing_policy
```

## reusable_commands

check_beta_health:

```powershell
curl.exe https://mesasbeta.artificiorpg.com/api/v1/health
```

check_beta_oauth_redirect:

```powershell
curl.exe -I https://mesasbeta.artificiorpg.com/api/v1/auth/google
```

check_beta_stack:

```powershell
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231 "docker compose -f /opt/mesas-beta/docker-compose.beta.yml ps"
```

check_beta_env_file:

```powershell
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231 "grep -E '^(DATABASE_URL|GOOGLE_CALLBACK_URL|FRONTEND_URL|POSTGRES_USER|POSTGRES_DB)=' /opt/mesas-beta/.env"
```

check_beta_container_env:

```powershell
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231 "docker exec mesas-beta-api printenv | grep -E '^(APP_ENV|GOOGLE_CALLBACK_URL|FRONTEND_URL|DATABASE_URL)='"
```

check_beta_network:

```powershell
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231 "docker network inspect gerenciador_telegram_default --format '{{.Name}}'"
```

check_beta_volumes:

```powershell
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231 "docker volume ls --format '{{.Name}}' | grep -E 'mesas|pgdata'"
```

check_beta_db_mounts:

```powershell
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231 "docker inspect mesas-beta-db --format '{{range .Mounts}}{{println .Type .Name .Destination}}{{end}}'"
```

check_beta_api_logs:

```powershell
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231 "docker logs --tail 80 mesas-beta-api"
```

check_docker_cache:

```powershell
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231 "docker system df"
```

check_prod_remote_path_state:

```powershell
ssh -i "C:/projetos/mesas_rpg_artificio/ssh-key-2026-03-07privada.key" ubuntu@137.131.250.231 "echo '===== /opt/mesas =====' && ls -la /opt/mesas && echo && echo '===== arquivos até 2 níveis =====' && find /opt/mesas -maxdepth 2 -type f | sort"
```

