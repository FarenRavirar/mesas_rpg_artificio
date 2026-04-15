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
last_commit_validated: 5b09880
last_commit_message: "ajuste rapido"
beta_actions_deploy_after_push: success
last_deploy_date: 2026-04-14T06:02Z
beta_containers_status: all_healthy
beta_public_health: ok
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

# Auditoria 2026-04-13: Docker Compose
compose_issues_identified:
  - vite_api_url_arg_unused: "VITE_API_URL não é necessária — frontend usa URLs relativas + proxy Nginx"
  - db_logs_volume_invalid: "./logs/db:/var/log/postgresql não funciona no PostgreSQL Alpine"
  - healthcheck_wget_validated: "wget está disponível no Node Alpine — healthcheck atual funciona"
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
  build_args_configured:
    - VITE_ENABLE_DEVTOOLS  # true em beta
    - VITE_API_URL  # Obrigatório - URL base da API para o frontend
    - VITE_CLOUDINARY_CLOUD_NAME  # Obrigatório - cloud name para componente de upload
  nginx_static_root: /usr/share/nginx/html
  nginx_build_copy: /app/dist → /usr/share/nginx/html
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

# Auditoria 2026-04-13: Frontend não precisa de VITE_API_URL
vite_api_url_behavior:
  defined_in_code: "const API_BASE = import.meta.env.VITE_API_URL || ''"
  when_empty: "URLs relativas (/api/v1/...) são roteadas pelo Nginx para mesas-beta-api:3000"
  current_state: "VITE_API_URL não está definida em nenhum docker-compose"
  runtime_behavior: "Funciona corretamente com URLs relativas"
  recommendation: "Remover ARG VITE_API_URL do Dockerfile (código morto)"
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
  - /api/v1/upload  # upload de imagens via backend + Cloudinary signed

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
POSTGRES_PASSWORD=MesasRPG#2026!Xk9vPq
POSTGRES_DB=mesas_rpg
DATABASE_URL=postgresql://admin:MesasRPG%232026!Xk9vPq@mesas-beta-db:5432/mesas_rpg
GOOGLE_CLIENT_ID=SEU_GOOGLE_CLIENT_ID_AQUI
GOOGLE_CLIENT_SECRET=SEU_GOOGLE_CLIENT_SECRET_AQUI
GOOGLE_CALLBACK_URL=https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback
FRONTEND_URL=https://mesasbeta.artificiorpg.com
JWT_SECRET=a1f3c7e2b9d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a6
JWT_REFRESH_SECRET=f6d4b2a0e8c6f4d2b0a8e6c4f2d0b8a6e4c2f0d8b6a4e2c0f8d6b4a2e0c8f6d4
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=7d
IMGUR_CLIENT_ID=SUBSTITUIR_DEPOIS  # não usado, sendo removido
DISCORD_CLIENT_ID=1490592397950976162
DISCORD_CLIENT_SECRET=-y9qOC4ICxVJ2l-iM9n81m110chyaNWH
DISCORD_GUILD_ID=1258189767720304672
DISCORD_REDIRECT_URI=https://mesasbeta.artificiorpg.com/auth/discord/callback
FRONTEND_URLS=https://mesasbeta.artificiorpg.com,http://localhost:5173,http://127.0.0.1:5173
COOKIE_SAME_SITE=none
# FALTAM (necessárias para Cloudinary):
# VITE_CLOUDINARY_CLOUD_NAME=
# VITE_CLOUDINARY_UPLOAD_PRESET=
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
  status: Up 3 hours (healthy)
  health_status: healthy
  build_artifacts: /usr/share/nginx/html/

mesas-beta-api:
  internal_port: 3000/tcp
  status: Up 3 hours (healthy)
  health_status: healthy

mesas-beta-db:
  internal_port: 5432/tcp
  status: Up 3 hours (healthy)
  health_status: healthy

deploy_lock_state:
  file: /tmp/mesas-beta-deploy.lock
  age: 3 hours
  should_be_removed: true
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
- migration_06_system_suggestions_applied_to_beta: true  # 2026-04-04
- migration_07_notifications_applied_to_beta: true  # 2026-04-04
- migration_09_table_fields_applied_to_beta: true  # 2026-04-04 (frequency, rules_notes, banner_url)
- crud_sistemas_colaborativo_implemented: true
- notification_system_in_app_implemented: true
- jwt_expires_in_updated_to_7d: true  # 2026-04-04 (era 15m)
- auth_context_intelligent_validation_implemented: true  # 2026-04-04
- req_18_fluxo_revisao_candidatos_implemented: true  # 2026-04-05 (em_validacao)
- req_19_melhorias_ux_nielsen_phase_1_4_implemented: true  # 2026-04-05 (em_validacao)
- req_20_banner_gm_avatar_mapped: true  # 2026-04-05 (mapeamento frontend implementado)
- req_20_migration_10_covil_expiration_pending: true  # 2026-04-05 (is_covil + imported_expires_at — a aplicar no beta)
- python_runtime_available_in_backend_container: true  # python3 instalado via Dockerfile alpine packages
# Auditoria Docker Compose 2026-04-13:
- frontend_uses_relative_urls_proxied_by_nginx: true
- vite_api_url_arg_not_required: true
- wget_available_in_node_alpine_image: true
- healthcheck_with_wget_works: true
- postgres_alpine_ignores_var_log_postgresql_mount: true
- db_logs_volume_should_be_removed: true
# Auditoria Cloudinary e Workflow 2026-04-14:
- beta_containers_all_healthy: true
- beta_nginx_serves_from_usr_share_nginx_html: true
- beta_multistage_dockerfile_validated: true
- cloudinary_build_args_configured_in_compose: true
- cloudinary_env_vars_not_present_in_beta_env: true
- imgur_being_removed_from_project: true
- workflow_validates_nonexistent_cloudinary_vars: true  # BUG - causa falha
- workflow_lock_timeout_excessive_10min: true  # BUG - deveria ser 2min
- workflow_frontend_validation_wrong_path: true  # BUG - valida /app/dist ao invés de /usr/share/nginx/html
- workflow_missing_automatic_rollback: true  # FALTA
- deploy_lock_file_not_cleaned_after_deploy: true  # BUG - /tmp/mesas-beta-deploy.lock persiste
- beta_disk_usage_healthy_16_percent: true
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
## docker_compose_audit_2026_04_13

issues_identified:
  1_db_logs_volume:
    file: docker-compose.beta.yml + docker-compose.prod.yml
    line: "- ./logs/db:/var/log/postgresql"
    problem: "PostgreSQL Alpine não escreve logs em /var/log/postgresql"
    action: "Remover essa linha (volume inútil)"
    severity: low

  2_vite_api_url_unused:
    file: docker-compose.beta.yml + docker-compose.prod.yml
    problem: "ARG VITE_API_URL nunca é passada nos build args"
    current_behavior: "Frontend usa URLs relativas que são roteadas pelo Nginx"
    action: "Remover ARG do Dockerfile ou documentar como não-necessário"
    severity: cleanup_only

  3_healthcheck_validated:
    file: docker-compose.beta.yml + docker-compose.prod.yml
    current: "wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health"
    validation: "wget está instalado no Node Alpine — funciona corretamente"
    action: "Nenhuma mudança necessária"
    severity: none

architecture_validated:
  frontend_to_api_flow: "Browser → Cloudflare → mesas-beta-frontend:80 (nginx) → proxy /api/ → mesas-beta-api:3000"
  api_url_resolution: "Frontend usa '' (vazio) para API_BASE → URLs relativas /api/v1/... → roteadas pelo Nginx"
  nginx_proxy_config: "location /api/ { proxy_pass http://${API_UPSTREAM}:3000; }"
  working_correctly: true


## cloudinary_and_image_upload_audit_2026_04_14

current_state:
  docker_compose_has_cloudinary_args: true
  build_args_present:
    - VITE_CLOUDINARY_CLOUD_NAME
    - VITE_CLOUDINARY_UPLOAD_PRESET
  
  remote_beta_env_status:
    vite_cloudinary_cloud_name: not_present
    vite_cloudinary_upload_preset: not_present
    vite_api_url: not_present
  
  frontend_env_example:
    vite_api_url: ""  # vazio
    vite_cloudinary_cloud_name: ""  # vazio
    vite_cloudinary_upload_preset: ""  # vazio
  
  local_frontend_env:
    vite_api_url: ""  # apenas esta variável presente

  imgur_references:
    backend_env_imgur_client_id: "SUBSTITUIR_DEPOIS"  # placeholder não usado
    status: being_removed
    action_required: "Remover referências a Imgur do código e .env"

banner_upload_implementation:
  current_method: "URL input manual (usuário hospeda externamente)"
  component: "frontend/src/components/form-steps/steps/StepFinal.tsx"
  database_field: "tables.banner_url (string)"
  
  limitations:
    - no_upload_capability: true
    - no_webp_conversion: true
    - no_resize_to_1200x650: true
    - no_size_validation: true
  
  planned_solution:
    provider: cloudinary
    method: "Frontend upload direto (unsigned preset)"
    conversion: "Server-side WebP 1200x650"
    storage: "Permanente (sem expiração)"
    free_tier: "25GB storage + 25GB bandwidth/mês"
  
  implementation_status:
    dockerfile_args: ready
    env_variables: pending
    upload_component: pending
    integration: pending

workflow_deploy_beta_issues:
  1_cloudinary_validation:
    location: ".github/workflows/deploy-beta.yml linha 35-36"
    problem: "Valida VITE_CLOUDINARY_* como obrigatórias mas não existem no .env"
    impact: "Deploy falhará se variáveis não forem adicionadas"
    action: "Tornar validação opcional até Cloudinary ser configurado"
    severity: high
  
  2_lock_timeout_excessive:
    location: "linha 19"
    current: "flock -w 600  # 10 minutos"
    problem: "Timeout muito alto para lock de deploy"
    action: "Reduzir para 120 segundos (2 minutos)"
    severity: medium
  
  3_frontend_validation_wrong_path:
    location: "linha 109"
    current: "grep 'build completed' em logs"
    problem: "Validação fraca e path /app/dist incorreto"
    real_path: "/usr/share/nginx/html/"
    action: "Validar se index.html existe no path correto"
    severity: medium
  
  4_recovery_logic_duplicated:
    location: "linhas 88-106"
    problem: "Lógica de recuperação automática duplicada para HTTP e Health"
    action: "Criar função reutilizável validate_beta()"
    severity: low
  
  5_no_automatic_rollback:
    problem: "Deploy falho deixa ambiente quebrado"
    action: "Implementar rollback automático em caso de falha"
    severity: high
  
  6_image_prune_aggressive:
    location: "linha 113"
    current: "docker image prune -f  # remove TODAS imagens não usadas"
    problem: "Pode afetar outros projetos no servidor"
    action: "Filtrar por label do projeto: --filter label=com.docker.compose.project=mesas-beta"
    severity: medium
  
  7_lock_file_not_cleaned:
    location: "/tmp/mesas-beta-deploy.lock"
    observed: "Lock file de 3h atrás ainda existe"
    problem: "Lock não é removido ao final do deploy"
    action: "Adicionar trap para remover lock em caso de erro"
    severity: low

deployment_facts_validated:
  beta_nginx_serves_from: /usr/share/nginx/html/
  beta_build_artifacts_present:
    - index.html
    - assets/
    - favicon.svg
    - icons.svg
    - vtt-logos/
  
  beta_multistage_dockerfile: true
  stage_1_builder: "node:22-alpine AS builder"
  stage_2_runtime: "nginx:alpine AS production"
  
  disk_usage_healthy:
    root_partition: "146G total, 23G used (16%), 123G available"
    docker_images: "3.455GB (48% reclaimable)"
    docker_volumes: "1.055GB (4% reclaimable)"
    docker_build_cache: "894.8MB (100% reclaimable)"


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
ssh -F C:\projetos\config faren "cd /opt/mesas-beta && docker compose -f docker-compose.beta.yml ps"
```

check_beta_env_file:

```powershell
ssh -F C:\projetos\config faren "cat /opt/mesas-beta/.env | grep -E 'VITE_|DATABASE_URL|GOOGLE_CALLBACK|FRONTEND_URL'"
```

check_beta_container_env:

```powershell
ssh -F C:\projetos\config faren "docker exec mesas-beta-api printenv | grep -E '^(APP_ENV|GOOGLE_CALLBACK_URL|FRONTEND_URL|DATABASE_URL)='"
```

check_beta_network:

```powershell
ssh -F C:\projetos\config faren "docker network inspect gerenciador_telegram_default --format '{{.Name}}'"
```

check_beta_volumes:

```powershell
ssh -F C:\projetos\config faren "docker volume ls --format '{{.Name}}' | grep -E 'mesas|pgdata'"
```

check_beta_db_mounts:

```powershell
ssh -F C:\projetos\config faren "docker inspect mesas-beta-db --format '{{range .Mounts}}{{println .Type .Name .Destination}}{{end}}'"
```

check_beta_api_logs:

```powershell
ssh -F C:\projetos\config faren "docker logs --tail 80 mesas-beta-api"
```

check_docker_cache:

```powershell
ssh -F C:\projetos\config faren "docker system df"
```

check_prod_remote_path_state:

```powershell
ssh -F C:\projetos\config faren "echo '===== /opt/mesas =====' && ls -la /opt/mesas && echo && echo '===== arquivos até 2 níveis =====' && find /opt/mesas -maxdepth 2 -type f | sort"
```

check_beta_frontend_files:

```powershell
ssh -F C:\projetos\config faren "docker compose -f /opt/mesas-beta/docker-compose.beta.yml exec -T mesas-beta-frontend ls -lh /usr/share/nginx/html/"
```

check_beta_deploy_lock:

```powershell
ssh -F C:\projetos\config faren "ls -lh /tmp/mesas-beta-deploy.lock 2>/dev/null || echo 'Lock não existe'"
```

check_beta_health_from_server:

```powershell
ssh -F C:\projetos\config faren "curl -s https://mesasbeta.artificiorpg.com/api/v1/health"
```

check_disk_usage:

```powershell
ssh -F C:\projetos\config faren "df -h / && docker system df"
```

add_cloudinary_to_beta_env:

```powershell
# EXECUTAR APÓS TER CREDENCIAIS CLOUDINARY
ssh -F C:\projetos\config faren "cat >> /opt/mesas-beta/.env << 'EOF'

# Cloudinary para upload de banners
VITE_CLOUDINARY_CLOUD_NAME=seu_cloud_name_aqui
VITE_CLOUDINARY_UPLOAD_PRESET=mesas_rpg_banners
EOF"
```

remove_imgur_from_beta_env:

```powershell
ssh -F C:\projetos\config faren "sed -i '/IMGUR_CLIENT_ID/d' /opt/mesas-beta/.env"
```