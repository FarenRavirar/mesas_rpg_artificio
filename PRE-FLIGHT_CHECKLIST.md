# PRE-FLIGHT_CHECKLIST.md

## Objetivo

Detectar problemas de ambiente, template, encoding e configuração antes de iniciar implementação no **Anúncios de Mesas RPG**.

## Quando ler

Quando houver início de tarefa técnica, falha de execução, falha de leitura de arquivo, suspeita de inconsistência ou problema de conexão com o Banco/API — incluindo falhas do AggregatorBot, CleanupWorker ou integração com Imgur.

## Não ler quando

Não é necessário em tarefas puramente conceituais sem execução.

## Pré-requisitos

- Estar no diretório do projeto
- Acesso ao shell (PowerShell no Windows, bash na VM)
- Branch ativa: `feature/<escopo>` alinhada com `dev` (ou branch de release equivalente)

---

## Passos

### 1. Sanidade do shell (Windows/PowerShell)

```powershell
Get-Location
Write-Output "ok"
Get-ChildItem -Force | Select-Object -First 20
```

### 2. Sanidade do shell (VM Oracle/bash)

```bash
pwd
echo "ok"
ls -la /opt/mesas-beta/
docker ps | grep mesas-beta
```

### 3. Presença de documentos centrais

Verificar existência na raiz do repositório:
- `AGENTS.md`
- `ARQUITETURA_PROJETO.md`
- `GIT_WORKFLOW.md`
- `OPERACAO_PRODUCAO.md`
- `ERRORS_SOLUTIONS.md`
- `TODO_OPERACIONAL.md`
- `FILA_IMPLEMENTACAO.md`

Verificar existência dos arquivos de banco:
- `database/init.sql`
- `database/migration_01_base_schema.sql`

### 4. Integridade básica de encoding

```powershell
Get-Content -Raw -Encoding UTF8 <arquivo>
```
Se aparecer texto corrompido (`Ã`, `Ã§`), normalizar para UTF-8 antes de continuar.

### 5. Verificação de variáveis de ambiente

Confirmar que `.env` existe com todas as variáveis necessárias:

```bash
# NÃO MOSTRAR OS VALORES — apenas confirmar presença
grep -c "POSTGRES_USER\|POSTGRES_PASSWORD\|JWT_SECRET\|IMGUR_CLIENT_ID\|GOOGLE_CLIENT_ID\|GOOGLE_CLIENT_SECRET" /opt/mesas-beta/.env
```

⚠️ Se qualquer variável estiver ausente, parar e configurar antes de continuar.

Variáveis obrigatórias mínimas:

| Variável | Uso |
|---|---|
| `POSTGRES_USER` | Conexão com o banco |
| `POSTGRES_PASSWORD` | Conexão com o banco |
| `JWT_SECRET` | Assinatura de tokens de sessão |
| `GOOGLE_CLIENT_ID` | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | OAuth Google |
| `IMGUR_CLIENT_ID` | Upload anônimo de imagens no Imgur |

### 6. Verificação específica do Imgur

```bash
# Confirmar que IMGUR_CLIENT_ID está presente e não vazia
grep "IMGUR_CLIENT_ID" /opt/mesas-beta/.env | grep -v "^#" | grep -v "=$"
```

⚠️ Se vazia ou ausente: **nenhum upload de imagem funcionará**. Parar e configurar antes de continuar qualquer tarefa que envolva cobertura de mesa ou perfil de mestre.

### 7. Dependências Python (para scripts de importação/infraestrutura)

```bash
python -c "import psycopg2, pandas, openpyxl"
```
Se falhar: criar/ativar venv e instalar requirements do diretório `scripts/`.

### 8. Verificação dos containers na VM

```bash
# Beta
docker ps | grep mesas-beta-app
# Esperado: container rodando na porta 30302

# Produção
docker ps | grep mesas-app
# Esperado: container ativo (roteamento via Cloudflare, sem porta pública obrigatória)

# AggregatorBot / CleanupWorker (rodam dentro do container da API)
docker logs mesas-beta-app --tail 30 | grep -E "aggregator|cleanup|cron"
```

### 9. Verificação de saúde do AggregatorBot e CleanupWorker
```bash
docker logs mesas-beta-app --tail=50 | grep -E "aggregator|cleanup|cron"
```

Para interpretação de sinais de problema e soluções, ver `ERRORS_SOLUTIONS.md` E082 e E083.

### 10. Gate anti-retrabalho antes de nova tentativa

Aplicar o gate de admissibilidade canônico de `AGENTS.MD` antes de qualquer nova tentativa.

### 11. Checklist de segurança da API

Antes de qualquer commit, confirmar:

| Item | Verificado |
|---|---|
| `IMGUR_CLIENT_ID` está no `.gitignore` e nunca hardcoded | ☐ |
| `cover_deletehash`, `avatar_deletehash`, `banner_deletehash` ausentes em todas as rotas públicas | ☐ |
| `GOOGLE_CLIENT_SECRET` e `JWT_SECRET` estão no `.gitignore` | ☐ |
| React/Vite não acessa o banco via query string | ☐ |
| Rotas restritas têm middleware de verificação JWT | ☐ |
| Upload de imagem ocorre apenas no Backend, nunca no Frontend | ☐ |
| Elevação de role (`player` → `gm`) ocorre apenas via Backend | ☐ |
| Nenhuma feature introduz paywall, anúncio ou coleta de dados não declarada | ☐ |

---

## Validação

- Todos os comandos de sanidade executam sem erro
- Arquivos centrais existem com nomes corretos (`ARQUITETURA_PROJETO.md`, não variantes com sufixo de versão)
- Não há erro de encoding evidente
- Variáveis de API, Banco, Google OAuth e Imgur ativas e isoladas no `.env`
- Container beta rodando na porta `30302`
- Container de produção ativo (mesmo sem porta publicada no host)
- AggregatorBot e CleanupWorker com logs de ciclo recente sem erros críticos
- Não há repetição cega de tentativa sem ajuste de hipótese/diagnóstico

## Rollback

Se qualquer etapa falhar:
1. Interromper implementação
2. Registrar sintoma em `ERRORS_SOLUTIONS.md` (se novo)
3. Corrigir ambiente e repetir pre-flight

## Referências

- `AGENTS.md`
- `ERRORS_SOLUTIONS.md`
- `OPERACAO_PRODUCAO.md`
- `ARQUITETURA_PROJETO.md`

## Limite de escopo

Este checklist não substitui validação funcional pós-deploy.
