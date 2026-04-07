# AUDITORIA DA VM — Estado Atual e Plano de Limpeza

**Data:** 2026-04-07  
**Ambiente:** Beta (`mesasbeta.artificiorpg.com`)  
**VM:** Oracle Cloud (faren)

---

## 📊 Estado Atual da VM

### Docker Disk Usage

| Tipo | Total | Ativo | Tamanho | Recuperável |
|------|-------|-------|---------|-------------|
| **Images** | 16 | 16 | 2.364 GB | 958.9 MB (40%) |
| **Containers** | 16 | 16 | 1.024 GB | 0 B (0%) |
| **Build Cache** | 455 | 0 | 2.699 GB | **2.699 GB (100%)** |
| **Volumes** | 6 | 5 | 893.7 MB | 48.85 MB (5%) |

**Total recuperável:** ~3.7 GB

---

## 🔍 Análise Detalhada

### 1. Imagem do Backend (mesas-beta-api)

**Tamanho atual:** 666 MB  
**Problema identificado:** Docker usou cache de camadas antigas

**Evidências:**
```bash
# Python ainda instalado no container
$ docker exec mesas-beta-api which python3
/usr/bin/python3

# Pacotes Python instalados
$ docker exec mesas-beta-api apk list --installed | grep python
boost1.84-python3-1.84.0-r3
python3-3.12.12-r0
```

**Causa raiz:**
O Dockerfile foi corrigido no repositório e sincronizado para a VM, mas o Docker Compose usou cache das camadas antigas durante o rebuild. As instruções `RUN apk add python3` foram cacheadas e não reexecutadas.

**Tamanho esperado após limpeza:** ~450-500 MB (redução de ~25%)

---

### 2. Build Cache

**Tamanho:** 2.699 GB  
**Status:** 100% recuperável (455 camadas não utilizadas)

**Conteúdo:**
- Camadas antigas do aggregator
- Instalações de Python/pip cacheadas
- Modelos spaCy baixados (~500 MB)
- Builds intermediários

---

### 3. Arquivos Residuais no Servidor

**Diretório:** `/opt/mesas-beta/`

**Arquivos identificados:**
```
/opt/mesas-beta/
├── backend/
│   ├── requirements.txt          # ❌ Não usado mais
│   ├── cenarios.json             # ✅ Ainda usado
│   └── sistemas.json             # ✅ Ainda usado
├── teste.json                    # ❌ 475 KB - arquivo de teste
└── docker-compose.prod.yml.backup # ⚠️ Backup antigo
```

---

### 4. Imagens Docker Antigas

**Problema:** Imagens antigas do aggregator podem estar ocupando espaço

**Verificação necessária:**
```bash
docker images --filter "dangling=true"
docker images | grep -E "mesas.*<none>"
```

---

## 🧹 Plano de Limpeza Completo

### Fase 1: Rebuild Forçado (SEM CACHE)

**Objetivo:** Reconstruir imagem do backend sem usar cache, eliminando Python

**Comandos:**
```bash
# Conectar na VM
ssh faren

# Parar containers
cd /opt/mesas-beta
docker compose -f docker-compose.beta.yml down

# Rebuild forçado SEM CACHE
docker compose -f docker-compose.beta.yml build --no-cache mesas-beta-api

# Subir containers
docker compose -f docker-compose.beta.yml up -d

# Validar
docker exec mesas-beta-api which python3  # Deve retornar erro
docker images mesas-beta-mesas-beta-api --format '{{.Size}}'  # Deve ser ~450-500MB
```

**Tempo estimado:** 5-7 minutos  
**Downtime:** ~2 minutos  
**Espaço recuperado:** ~150-200 MB na imagem

---

### Fase 2: Limpar Build Cache

**Objetivo:** Remover 2.699 GB de cache não utilizado

**Comandos:**
```bash
# Limpar todo o build cache
docker builder prune -af

# Validar
docker system df
```

**Tempo estimado:** 1 minuto  
**Downtime:** Nenhum  
**Espaço recuperado:** 2.699 GB

---

### Fase 3: Remover Imagens Antigas

**Objetivo:** Remover imagens dangling e antigas do aggregator

**Comandos:**
```bash
# Remover imagens dangling
docker image prune -f

# Listar imagens antigas
docker images --filter "dangling=true"

# Se houver imagens antigas específicas do aggregator
docker images | grep aggregator
docker rmi <image_id>
```

**Tempo estimado:** 1 minuto  
**Downtime:** Nenhum  
**Espaço recuperado:** ~500-900 MB

---

### Fase 4: Limpar Arquivos Residuais

**Objetivo:** Remover arquivos não utilizados do servidor

**Comandos:**
```bash
cd /opt/mesas-beta

# Remover requirements.txt (não usado mais)
rm -f backend/requirements.txt

# Remover arquivo de teste
rm -f teste.json

# Remover backup antigo (se não for necessário)
rm -f docker-compose.prod.yml.backup

# Validar
ls -lh
```

**Tempo estimado:** 30 segundos  
**Downtime:** Nenhum  
**Espaço recuperado:** ~476 KB

---

### Fase 5: Executar Migration do Banco

**Objetivo:** Remover tabelas do aggregator do PostgreSQL

**Comandos:**
```bash
# Verificar se migration existe
ls -la /opt/mesas-beta/database/migration_99_drop_aggregator_tables.sql

# Executar migration
docker exec mesas-beta-db psql -U admin -d mesas_rpg -f /docker-entrypoint-initdb.d/migration_99_drop_aggregator_tables.sql

# Validar
docker exec mesas-beta-db psql -U admin -d mesas_rpg -c "\dt" | grep aggregator
# Não deve retornar nada
```

**Tempo estimado:** 1 minuto  
**Downtime:** Nenhum  
**Espaço recuperado:** ~10-50 MB no banco

---

## ⚠️ Riscos e Mitigações

### Risco 1: Downtime Durante Rebuild

**Probabilidade:** Alta  
**Impacto:** Médio (2-3 minutos de indisponibilidade)

**Mitigação:**
- Executar em horário de baixo tráfego
- Avisar usuários previamente
- Ter backup pronto para rollback

---

### Risco 2: Falha no Rebuild

**Probabilidade:** Baixa  
**Impacto:** Alto (site fora do ar)

**Mitigação:**
- Backup da imagem atual antes de começar:
  ```bash
  docker tag mesas-beta-mesas-beta-api:latest mesas-beta-mesas-beta-api:backup-2026-04-07
  ```
- Rollback rápido se necessário:
  ```bash
  docker compose -f docker-compose.beta.yml down
  docker tag mesas-beta-mesas-beta-api:backup-2026-04-07 mesas-beta-mesas-beta-api:latest
  docker compose -f docker-compose.beta.yml up -d
  ```

---

### Risco 3: Perda de Dados no Banco

**Probabilidade:** Muito Baixa  
**Impacto:** Crítico

**Mitigação:**
- Backup do banco antes da migration:
  ```bash
  docker exec mesas-beta-db pg_dump -U admin mesas_rpg > /tmp/backup_pre_migration_$(date +%Y%m%d).sql
  ```
- Testar migration em ambiente local primeiro

---

## 📋 Checklist de Execução

### Pré-Limpeza
- [ ] Criar backup da imagem atual
- [ ] Criar backup do banco de dados
- [ ] Verificar que branch `backup/pre-remocao-aggregator-2026-04-07` existe
- [ ] Avisar usuários sobre manutenção (se necessário)

### Execução
- [ ] **Fase 1:** Rebuild forçado sem cache
- [ ] **Fase 2:** Limpar build cache
- [ ] **Fase 3:** Remover imagens antigas
- [ ] **Fase 4:** Limpar arquivos residuais
- [ ] **Fase 5:** Executar migration do banco

### Pós-Limpeza
- [ ] Validar API: `curl https://mesasbeta.artificiorpg.com/api/v1/health`
- [ ] Validar frontend: `curl -I https://mesasbeta.artificiorpg.com`
- [ ] Verificar logs: `docker logs mesas-beta-api --tail 50`
- [ ] Confirmar Python removido: `docker exec mesas-beta-api which python3` (deve falhar)
- [ ] Verificar tamanho da imagem: `docker images mesas-beta-mesas-beta-api`
- [ ] Verificar espaço recuperado: `docker system df`
- [ ] Validar tabelas removidas: `docker exec mesas-beta-db psql -U admin -d mesas_rpg -c "\dt" | grep aggregator`

---

## 🎯 Resultado Esperado

### Antes da Limpeza

| Métrica | Valor |
|---------|-------|
| Imagem backend | 666 MB |
| Build cache | 2.699 GB |
| Imagens antigas | ~900 MB |
| Arquivos residuais | ~476 KB |
| Tabelas aggregator | ~10-50 MB |
| **Total** | **~4.3 GB** |

### Depois da Limpeza

| Métrica | Valor | Redução |
|---------|-------|---------|
| Imagem backend | ~450 MB | -216 MB (-32%) |
| Build cache | 0 GB | -2.699 GB (-100%) |
| Imagens antigas | 0 GB | -900 MB (-100%) |
| Arquivos residuais | 0 KB | -476 KB (-100%) |
| Tabelas aggregator | 0 MB | -50 MB (-100%) |
| **Total** | **~450 MB** | **-3.85 GB (-90%)** |

---

## 🚀 Comandos Consolidados (Execução Rápida)

```bash
# 1. Conectar na VM
ssh faren

# 2. Backup da imagem
docker tag mesas-beta-mesas-beta-api:latest mesas-beta-mesas-beta-api:backup-2026-04-07

# 3. Backup do banco
docker exec mesas-beta-db pg_dump -U admin mesas_rpg > /tmp/backup_pre_migration_$(date +%Y%m%d).sql

# 4. Rebuild forçado
cd /opt/mesas-beta
docker compose -f docker-compose.beta.yml down
docker compose -f docker-compose.beta.yml build --no-cache mesas-beta-api
docker compose -f docker-compose.beta.yml up -d

# 5. Limpar cache e imagens
docker builder prune -af
docker image prune -f

# 6. Limpar arquivos
rm -f backend/requirements.txt teste.json docker-compose.prod.yml.backup

# 7. Migration do banco
docker exec mesas-beta-db psql -U admin -d mesas_rpg -f /docker-entrypoint-initdb.d/migration_99_drop_aggregator_tables.sql

# 8. Validação
curl https://mesasbeta.artificiorpg.com/api/v1/health
docker exec mesas-beta-api which python3  # Deve falhar
docker images mesas-beta-mesas-beta-api --format '{{.Size}}'
docker system df
```

---

## 📝 Notas Importantes

> [!CAUTION]
> **Rebuild sem cache é obrigatório**
> 
> O simples `docker compose up -d --build` NÃO é suficiente. O Docker reutilizará camadas cacheadas que ainda contêm Python. Use `--no-cache` para forçar rebuild completo.

> [!IMPORTANT]
> **Migration é irreversível**
> 
> A migration `migration_99_drop_aggregator_tables.sql` remove permanentemente as tabelas do aggregator. Certifique-se de ter backup antes de executar.

> [!NOTE]
> **Espaço em disco**
> 
> A VM tem espaço suficiente para a operação. O rebuild temporariamente duplicará o uso de disco (~1.3 GB extras), mas será liberado após a limpeza.

---

**Documento gerado por:** Auditoria automatizada da VM  
**Última atualização:** 2026-04-07  
**Versão:** 1.0
