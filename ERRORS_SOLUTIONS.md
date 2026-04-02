# ERRORS_SOLUTIONS.md

Registro de erros, sintomas, causas prováveis, diagnóstico rápido e soluções validadas.

---

## Objetivo

Centralizar incidentes recorrentes e respectivas soluções validadas para reduzir retrabalho.

## Quando ler

Sempre que ocorrer erro, falha de execução ou comportamento inesperado.

## Protocolo obrigatório de causa raiz (antes de corrigir)

Para incidentes sem solução imediata na tabela, seguir este fluxo mínimo:

1. Reproduzir o erro 2 vezes (mesmo sintoma)
2. Identificar ponto de transição (onde o estado sai de correto para incorreto)
3. Formular hipótese testável e falsificável
4. Testar mudando uma variável por vez
5. Registrar recibo curto de causa raiz: sintoma → causa confirmada → evidência → alternativa descartada

Regra: sem causa raiz mínima, não aplicar correção estrutural.

## Rollback

Se a solução não funcionar:
1. Desfazer alteração aplicada
2. Retornar ao estado anterior estável
3. Registrar novo caso para investigação

---

## Índice rápido por categoria

Use para localizar o erro sem varrer a tabela inteira:

| Categorias de erro mapeadas | IDs |
|---|---|
| GitHub Actions / CI-CD / Deploy | E035, E037, E040, E055, E056 |
| Docker / Containers / Rede | E038, E039, E057 |
| Git / Versionamento | E036, E071, E072 |
| TypeScript / Frontend / Build | E041, E042, E046, E067, E074 |
| Banco de Dados / SQL / PostgreSQL | E043, E049, E054, E059, E064, E065, E068, E075, E086 |
| Ferramentas automatizadas / Agentes | E045, E050, E051, E052, E053, E058, E060, E061, E062, E063, E066, E070, E073, E076, E085 |
| Backend / API Node.js | E078, E087, E088 |
| Imgur / Upload de Imagens | E079, E080, E081 |
| AggregatorBot / CleanupWorker | E082, E083, E084 |

---

## Categoria: GitHub Actions / CI-CD / Deploy

| ID | Sintoma | Causa provável | Diagnóstico rápido | Solução validada | Prevenção |
|---|---|---|---|---|---|
| E035 | `drone-scp error: Process exited with status 1` no GitHub Actions | `rm: true` falha por permissão ou o diretório pai (`/opt`) é protegido | Logs do `scp-action` mostrando "Remove target folder" seguido de erro | Desativar `rm: true` no workflow e garantir permissões manuais via `chown` no servidor | Criar diretório e ajustar ownership (`sudo chown ubuntu:ubuntu`) antes do primeiro deploy |
| E037 | OOM (Out of Memory) ou lentidão extrema no build dentro da VM Oracle | Build do React/Vite consome muitos recursos em VMs ARM pequenas | `docker compose logs` mostrando falha de memória ou travamento do host | Realizar o build no GitHub Runner e copiar apenas a pasta `dist` final para o servidor | Preferir build no runner (GitHub-side) em vez de build no host (Oracle-side) para apps frontend |
| E040 | `rsync: connection unexpectedly closed (exit code 11)` | Diretório de destino não existe na máquina remota (VM) | Logs do GitHub Actions mostrando falha no rsync logo após mudar caminhos de pasta | Adicionar `ssh mkdir -p /path/to/dest` antes do passo de rsync no workflow YAML | Sempre garantir que o diretório pai existe antes de realizar rsync em caminhos complexos ou novos |
| E055 | `unknown flag: --branch` ao executar `gh run list --branch dev` na VM | Versão do GitHub CLI instalada na VM não suporta o parâmetro `--branch` | Comando retorna `unknown flag: --branch` | Usar: `gh run list --repo FarenRavirar/mesas_rpg_artificio -L 5 --json databaseId,name,status,conclusion,headBranch,createdAt` | Validar flags com `gh run list --help` no ambiente alvo antes de automatizar |
| E056 | `Unknown JSON field` ao executar `gh run list --json` com campos `displayTitle` ou `workflowName` | Versão do CLI da VM expõe schema reduzido | Comando falha listando campos permitidos | Usar apenas campos suportados: `conclusion`, `createdAt`, `databaseId`, `event`, `headBranch`, `headSha`, `name`, `status`, `updatedAt`, `url`, `workflowDatabaseId` | Validar schema exato com `gh run list --help` antes de usar `--json` |

---

## Categoria: Docker / Containers / Rede

| ID | Sintoma | Causa provável | Diagnóstico rápido | Solução validada | Prevenção |
|---|---|---|---|---|---|
| E038 | Erro 502 Bad Gateway no Cloudflare Tunnel | `cloudflared` tenta acessar `localhost:30302` (ele mesmo) | Log do `cloudflared` mostrando "connection refused" ou timeout | Usar o nome do container na mesma rede Docker (`http://mesas-beta-app:80`) | Configurar túnel para apontar para nome do container + porta interna |
| E039 | `Host not found` / `Connection Refused` entre containers de projetos diferentes | Container do túnel não "enxerga" o app por isolamento de rede | `ping <container-name>` falhando de dentro do container do túnel | Adicionar a rede do túnel (ex: `gerenciador_telegram_default`) como `external` no `docker-compose.beta.yml` do projeto | Planejar rede compartilhada para serviços de infraestrutura comuns (túnel, banco, proxy) |
| E057 | `No such container` ao tentar `docker exec` no Postgres na VM | `container_name` não definido explicitamente; Docker Compose gera nome baseado na pasta | Comando SSH falha instantaneamente com "No such container" | Executar na VM `docker ps \| grep mesas` para identificar o nome correto gerado em runtime | Documentar sempre os nomes canônicos: `mesas-beta-db` e `mesas-db` |

---

## Categoria: Git / Versionamento

| ID | Sintoma | Causa provável | Diagnóstico rápido | Solução validada | Prevenção |
|---|---|---|---|---|---|
| E036 | `.gitignore` não funciona e arquivos pesados/sensíveis sobem para o Git | Quebras de linha enviadas como literais `\n` via comando shell/powershell | `git ls-files` exibindo `node_modules`, `.env` ou chaves privadas | Corrigir arquivo `.gitignore` manualmente com quebras de linha reais e limpar cache: `git rm -rf --cached` | Validar conteúdo do `.gitignore` e `git status` antes de grandes commits iniciais |
| E071 | `fatal: '<branch>' is already used by worktree at '<path>'` ao executar `git checkout` | A branch alvo já está anexada a outro worktree local e não pode ser checked out simultaneamente | `git checkout <branch>` retorna erro apontando caminho do worktree que já mantém essa branch ativa | Executar operações da branch no worktree indicado via `git -C <path> ...` (merge/push), ou remover/desanexar o worktree antes de novo checkout | Antes de trocar branch em repositórios com múltiplos worktrees, validar com `git worktree list` |
| E072 | `gh pr merge <id>` retorna `is not mergeable: the merge commit cannot be cleanly created` | Divergência entre `main` e `dev` impede merge automático direto da PR | `gh pr merge` falha com instrução para `gh pr checkout` + `git merge origin/main` | Sincronizar `dev` com `main` por branch intermediária: `git checkout -b sync/dev-main origin/dev` → `git merge origin/main` → resolver conflitos → push para `dev`; depois recriar PR e mergear | Antes de abrir PR de promoção, rodar `git log --oneline origin/dev..origin/main` e alinhar branches se houver commit exclusivo em `main` |

---

## Categoria: TypeScript / Frontend / Build

| ID | Sintoma | Causa provável | Diagnóstico rápido | Solução validada | Prevenção |
|---|---|---|---|---|---|
| E041 | `TS2305: Module 'authMiddleware' has no exported member 'verifyToken'` | Regressão de refatoração (renomeação de função exportada) | Falha no `tsc` durante o build no Docker | Atualizar os `imports` nas rotas para o novo nome da função | Realizar busca global (`grep`) por referências ao antigo nome após qualquer refatoração de exports |
| E042 | `TS2304: Cannot find name 'AlertCircle'` (ou outros ícones) | Esquecimento de importação explícita de componentes de ícone no React | Falha no compilador TypeScript ou lint em tempo de edição | Adicionar o componente ao `import { ... } from 'lucide-react'` | Ativar auto-import no IDE e rodar `npm run build` local antes do commit |
| E046 | `Error: spawn EPERM` no `vite build` / `esbuild` em sandbox | Restrição de execução de subprocesso no sandbox para o binário do `esbuild` | `npm run build` falha com "failed to load config ... spawn EPERM" | Reexecutar o build com permissão escalada fora do sandbox | Antecipar necessidade de execução fora do sandbox quando esse sintoma aparecer |
| E067 | `ESLint couldn't find a configuration file` ao rodar `npm run lint` no frontend | Script `lint` existe no `package.json`, mas o projeto não possui arquivo de configuração ESLint versionado | Execução termina com mensagem do ESLint pedindo `npm init @eslint/config` | Tratar `lint` como indisponível até adicionar configuração oficial; usar `npm run build` como gate de qualidade imediato | Evitar acionar `npm run lint` como critério de release enquanto não houver config ESLint no repositório |
| E074 | `TS2322: Type 'string \| string[]' is not assignable to type 'string'` em integrações do backend | Valores de `req.body`/`req.params` chegam com tipagem ampla e não casam com tipos literais das funções de serviço | `npm run build` (backend) falha apontando linhas de chamada de serviço | Normalizar antes de chamar o serviço (`String(...)`) e criar variável tipada após validação; ajustar tipagem do executor de query para aceitar `rowCount` nulo | Em integrações novas com TypeScript estrito, sempre criar variáveis "safe"/normalizadas entre entrada HTTP e chamadas de serviço tipadas |
| E090 | `Throttling navigation to prevent the browser from hanging` seguido de travamento na UI do frontend | Loop infinito no React Router causado por uma função de context (`login`/`logout`) incluida no array de dependências de um `useEffect` sem estar memoizada | O Console alerta sobre IPC flooding logo após o componente montar e a CPU sobe pra 100% na aba | Envolver a declaração da função exportada pelo Context Provider com `useCallback` | Sempre envolver métodos expostos em Contextos React com `useCallback`, para evitar re-criação da referência da função a cada mudança de estado do provider |

---

## Categoria: Banco de Dados / SQL / PostgreSQL

| ID | Sintoma | Causa provável | Diagnóstico rápido | Solução validada | Prevenção |
|---|---|---|---|---|---|
| E043 | `Postgres 500: null value in column "slug" violates not-null constraint` | Tentativa de criar entidade (mesa, sistema, perfil) sem fornecer o slug (campo obrigatório no banco) | Falha ao criar registro via painel ou API, retornando 500 no console | Aplicar `slugify.ts` nos controladores (`createTable`, `createSystem`, `createGmProfile`, etc.) para gerar slug automaticamente a partir do nome | Sempre gerar slugs automaticamente no Backend se o slug não for enviado |
| E049 | `ParserError` ao importar SQL (pg_dump modificado) | Aspas simples em campos de texto (ex: títulos de mesas) quebram o parser do PostgreSQL se não escapadas | Falha de transação com `syntax error at or near` ao executar `psql < arquivo.sql` | Usar script Python com psycopg2 e parâmetros (`cursor.execute(query, (val1, val2))`) em vez de arquivos SQL concatenados | Substituir DML manual por conectores ORM/DB API 2.0 em migrações de dados ricos |
| E054 | `ERROR: invalid reference to FROM-clause entry for table` durante UPDATE com `FROM LATERAL` | Subquery LATERAL no `UPDATE ... FROM` referencia alias da tabela alvo em contexto não permitido pelo PostgreSQL | Falha após `BEGIN`/`CREATE FUNCTION`, abortando a transação | Reescrever em 2 etapas: CTE `normalized` e `UPDATE ... FROM normalized n WHERE n.id = t.id` | Em migrations SQL, evitar `LATERAL` acoplado ao alias da tabela alvo; preferir CTE materializada |
| E059 | `FATAL: role "<usuario>" does not exist` ao rodar `psql` no container | Comando usa usuário incorreto enquanto o Postgres está configurado com `POSTGRES_USER=admin` | `docker exec mesas-beta-db psql -U <usuario> ...` falha com erro de role inexistente | Usar `psql -U admin -d mesas` e confirmar nome do banco no `docker-compose.beta.yml` | Antes de executar SQL remoto, validar usuário e database no compose: `docker exec mesas-beta-db env` |
| E064 | `missing FROM-clause entry for table "<alias>"` em query SQL | Uso de alias em `JOIN/WHERE` sem declarar o alias na cláusula `FROM` | `psql` retorna erro apontando linha com `<alias>.<campo>` | Declarar alias explicitamente na origem (`FROM public.tables t`) e manter consistência em toda a query | Em scripts SQL gerados, validar aliases no `SELECT` base antes de adicionar `JOIN`/`WHERE` |
| E065 | `column reference "<coluna>" is ambiguous` em query com múltiplos JOINs | Coluna usada sem prefixo de alias em contexto com tabelas que compartilham o mesmo nome de coluna | `psql` acusa ambiguidade na cláusula `ORDER BY` ou `SELECT` | Prefixar explicitamente com alias da tabela correta (ex.: `ORDER BY t.created_at`) | Em queries com JOIN, sempre qualificar `ORDER BY`, filtros e colunas repetidas com alias |
| E068 | Falha no merge beta→prod com `insert or update violates foreign key constraint` durante restore `--data-only` | Dump com tabelas autorreferenciadas pode inserir fora de ordem quando há FKs circulares | `pg_dump` já alerta "circular foreign-key constraints"; restore aborta | Executar import com `SET session_replication_role = replica;` antes dos inserts e retornar para `origin` ao final | Em consolidações com `pg_dump --data-only`, sempre tratar tabelas autorreferenciadas |
| E075 | `ERROR: function min(uuid) does not exist` em migration de backfill | PostgreSQL não expõe agregado `min` para `uuid` na forma usada, quebrando CTE de deduplicação | Execução da migration falha com rollback | Substituir `min(uuid)` por seleção determinística com `DISTINCT ON (...) ORDER BY id` | Em migrations com UUID, evitar agregadores numéricos; preferir seleção ordenada e explícita |
| E086 | API 502 / `Database connection failed: Invalid URL` no healthcheck | Caractere especial (ex: `#`) na senha `POSTGRES_PASSWORD` injetado diretamente na montagem da `DATABASE_URL` no `docker-compose.yml` quebrando o parse da URI | Log de erro acusa `Invalid URL` ao criar Connection Pool | Remover a composição da URI do arquivo Docker Compose e repassar `${DATABASE_URL}` inteira já encodada pelo `.env` (onde `#` vira `%23`) | Nunca interpolar variáveis de senha com possíveis símbolos especiais (como `#` e `@`) dentro de URIs sem *url-encoding* prévio |

---

## Categoria: Ferramentas automatizadas / Agentes

| ID | Sintoma | Causa provável | Diagnóstico rápido | Solução validada | Prevenção |
|---|---|---|---|---|---|
| E045 | `windows sandbox: CreateProcessWithLogonW failed: 1056` durante leitura paralela no PowerShell | Limitação de criação de processo no sandbox Windows ao disparar comandos simultâneos | Falha ao executar múltiplos `Get-Content` em paralelo; execução individual funciona | Reexecutar as leituras em modo sequencial (`shell_command` único por vez) | Em sessões Windows, reduzir paralelismo para operações de leitura simples |
| E050 | `fallback failed: target content not found` ao editar arquivo via ferramenta automatizada | Diferença de escape/literal entre trecho alvo e conteúdo real impede match exato | Mensagem da ferramenta indicando "Could not successfully apply any edits" | Recarregar o trecho com `view_file`, reduzir escopo para bloco contíguo e aplicar `replace_file_content` | Em ajustes com strings escapadas (SQL/regex), validar literal primeiro e preferir edições incrementais |
| E051 | `bash: findstr: command not found` em diagnóstico remoto via SSH | Comando específico de Windows (`findstr`) executado em shell Linux da VM Oracle | Erro imediato no retorno do SSH | Substituir por `grep` ou filtros nativos do Linux | Em comandos remotos Linux, evitar utilitários exclusivos do Windows; priorizar comandos POSIX |
| E052 | `bash: -c: line 1: unexpected EOF while looking for matching` em comando SSH | Aspas simples e duplas aninhadas incorretamente no comando PowerShell enviado ao shell Linux | Erro de parsing imediato antes da execução | Simplificar quoting: evitar aninhamento excessivo, preferir `docker exec ... psql ...` direto | Em comandos cross-shell (PowerShell → SSH → bash), validar quoting mínimo e testar com query curta (`select 1`) |
| E053 | `ParserError` ao usar redirecionamento `<` em PowerShell para enviar SQL ao SSH | Operador `<` pode falhar no parser do PowerShell com aspas mistas | Erro com destaque no caractere `<` antes da execução remota | Substituir por pipeline: `Get-Content -Raw arquivo.sql \| ssh ... "docker exec -i ... psql ..."` | Em automações PowerShell, preferir `\|` para stdin remoto ao invés de `<` |
| E058 | `The process cannot access the file because it is being used by another process` ao limpar arquivos temporários | Processo mantém arquivo de lock aberto | `Remove-Item` falha com erro de lock no Windows | Encerrar o processo que criou o lock e então remover o arquivo | Antes de limpeza de workspace com arquivos abertos, encerrar o app responsável |
| E060 | `command timed out` ao cruzar grandes volumes via script único | Consulta ampla demais para o timeout padrão da ferramenta | A execução termina com `command timed out after ... ms` sem concluir | Reduzir escopo da consulta (paginar ou buscar direto no banco), usar abordagem incremental | Para diagnósticos massivos, evitar carregar dataset completo via API quando uma consulta SQL resolve mais rápido |
| E061 | `ENOENT: no such file or directory` ao testar scripts locais | Script executado em diretório diferente do local do arquivo alvo (`cwd` incorreto) | Node/Python retorna `ENOENT` apontando caminho inexistente | Reexecutar com caminho absoluto correto ou ajustar `workdir` para a raiz do repositório | Em testes rápidos, sempre validar `cwd` e preferir caminho absoluto para artefatos fora da pasta atual |
| E062 | `SyntaxError: f-string expression part cannot include a backslash` em script Python | Uso de `\\n` ou escape dentro de expressão interpolada no `f-string` | Execução falha imediatamente antes da lógica principal | Extrair a expressão para variável intermediária e interpolar só a variável no `f-string` | Em scripts Python geradores de SQL, evitar expressões complexas com escapes dentro de `f-string` |
| E063 | `UnicodeDecodeError` em `subprocess.run(..., text=True)` ao ler saída de SSH/psql no Windows | Decodificação padrão (`cp1252`) não suporta bytes UTF-8/latin mistos na saída remota | Stack trace aponta `encodings\\cp1252.py` | Definir `encoding='utf-8'` e `errors='replace'` no `subprocess.run` | Em scripts que consomem saída remota, nunca depender do encoding padrão do host Windows |
| E066 | `UnicodeEncodeError` ao imprimir JSON UTF-8 no terminal Windows | Console local em CP1252 tenta renderizar caracteres fora da tabela (acentos/unicode) | Stack trace em `encodings\\cp1252.py` durante `print(...)` | Exibir com escape seguro (`value.encode('unicode_escape').decode()`) ou ajustar `PYTHONIOENCODING=utf-8` | Em diagnósticos de API com caracteres acentuados, evitar `print` direto sem padronizar encoding |
| E070 | `rg: *.md ... os error 123` ao rodar ripgrep no PowerShell com glob literal | No Windows/PowerShell, `*.md` como argumento literal pode gerar erro de sintaxe de caminho | Comando falha com "A sintaxe do nome do arquivo... está incorreta. (os error 123)" | Rodar `rg` sem glob literal no path (ex.: `rg -n "<padrao>" -g "*.md"` ou `rg -n "<padrao>" .`) | Em Windows, preferir `-g` para filtros de extensão e usar `.` como raiz de busca |
| E073 | `The term 'docker' is not recognized...` ao executar comandos Docker no host Windows | Docker CLI não está instalado no host local ou não está no `PATH` | PowerShell falha imediatamente ao chamar `docker ps` | Para operação dos ambientes do projeto, executar comandos Docker via SSH na VM Oracle (`ssh -F C:\\projetos\\config faren`) | Em validações de runtime, assumir como padrão o diagnóstico remoto na VM e não depender do host local |
| E076 | `Cannot process command because of one or more missing mandatory parameters: InputObject` ao usar `echo` em PowerShell | Em algumas sessões/policies, `echo` sem argumento entre comandos encadeados dispara erro de parâmetro obrigatório | Execução retorna stack do `Write-Output` após comando com `echo;` vazio | Evitar `echo` vazio; usar `Write-Host ''` ou executar os comandos separadamente | Em scripts PowerShell de diagnóstico, não usar `echo` sem argumento explícito |
| E085 | `grep: The term 'grep' is not recognized` ou `<comando>: command not found` no shell local | Comando exclusivo de bash Linux executado acidentalmente no terminal PowerShell do Host | O terminal recusa com `term is not recognized as a name of a cmdlet` | Substituir por utilitários equivalentes nativos (ex: `Select-String` no lugar de `grep`, exclusão com vírgulas no `rm`) | Ter constante ciência se o terminal instanciado é o Host (PowerShell) ou remote SSH (Bash) antes de executar comandos Linux |
| E091 | `Get-Content: The input object cannot be bound to any parameter` ao usar `git diff ... | cat` no PowerShell | Alias `cat` aponta para `Get-Content`, que espera caminho de arquivo e não recebe corretamente o pipe de texto do `git diff` | Comando termina com `Exit code: 1` e stack curta de binding do `Get-Content` | Não usar `| cat` no PowerShell para diffs; executar `git diff -- <arquivo>` diretamente (ou redirecionar para arquivo e abrir com `view_file`) | Em shell PowerShell, evitar aliases Unix ambíguos (`cat`, `grep`) em pipelines de saída textual |

---

## Categoria: Backend / API Node.js

| ID | Sintoma | Causa provável | Diagnóstico rápido | Solução validada | Prevenção |
|---|---|---|---|---|---|
| E041 | `TS2305: Module has no exported member` em rota do backend | Regressão de refatoração (renomeação de função exportada em middleware) | Falha no `tsc` durante o build no Docker | Atualizar os `imports` nas rotas para o novo nome da função | Realizar busca global por referências ao antigo nome após qualquer refatoração de exports |
| E078 | API Node.js não inicializa — container reinicia em loop | Variável de ambiente obrigatória ausente no `.env` (`DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `IMGUR_CLIENT_ID` ou `GOOGLE_CLIENT_SECRET`) ou banco PostgreSQL ainda não está disponível na rede Docker | `docker compose logs mesas-beta-app` mostra `Error: getaddrinfo ENOTFOUND` ou `password authentication failed` ou `Cannot read properties of undefined` logo no startup | Verificar `.env` com `grep -c "POSTGRES_USER\|JWT_SECRET\|IMGUR_CLIENT_ID\|GOOGLE_CLIENT_ID\|GOOGLE_CLIENT_SECRET" /opt/mesas-beta/.env`; se banco não estiver pronto, aguardar ou adicionar `depends_on` com `healthcheck` no compose | Sempre preencher `.env` antes do primeiro `docker compose up`; usar `depends_on` com condição `service_healthy` para a API aguardar o banco |
| E087 | `Cannot GET /auth/google/callback` após login Google no beta | `redirect_uri` efetivo ficou em `/auth/google/callback` (legado), mas a rota canônica ativa da API é `/api/v1/auth/google/callback`; quando o alias `/auth` não está realmente ativo no build em execução, o callback legado cai em 404 | 1) `curl -i https://mesasbeta.artificiorpg.com/auth/google/callback?code=test` retorna `404`; 2) `curl -i https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback?code=test` retorna `500` de código inválido (prova que a rota canônica existe); 3) `GET /api/v1/auth/google` retorna `302` com `redirect_uri` legado | **Não usar callback legado**. Padronizar Google Console + `GOOGLE_CALLBACK_URL` para `https://mesasbeta.artificiorpg.com/api/v1/auth/google/callback`; validar após deploy que o header `Location` de `/api/v1/auth/google` aponta para a URI canônica | Antes de qualquer teste manual de OAuth, validar primeiro o `Location` do `302` em `/api/v1/auth/google`. Se vier `/auth/google/callback`, não prosseguir com login até corrigir a configuração |
| E088 | Hotfix local de OAuth parece correto, mas ambiente beta continua com comportamento antigo | Alteração feita apenas no workspace local (ou em branch sem deploy), enquanto o runtime beta ainda usa configuração/build anterior (`GOOGLE_CALLBACK_URL` efetivo antigo) | `docker-compose.beta.yml` local aponta para `/api/v1/auth/google/callback`, porém o `Location` real de `/api/v1/auth/google` ainda mostra `/auth/google/callback` | Após alteração de OAuth, exigir ciclo completo: commit → push autorizado para `dev` → run `Deploy Beta` concluído → revalidar `Location` do `302` em produção beta. Se persistir, auditar `.env` remoto em `/opt/mesas-beta/` | Não considerar correção de OAuth concluída sem validação runtime da URL de redirecionamento efetiva (não apenas leitura de código local) |
| E089 | `{"error":"Erro de autenticação com provedor externo."}` após callback OAuth com `code` válido | `require('google-auth-library').google.oauth2(...)` falha com `Cannot read properties of undefined (reading 'oauth2')` — `google` não é exportado diretamente de `google-auth-library` dessa forma | `docker logs mesas-beta-api` mostra `TypeError: Cannot read properties of undefined (reading 'oauth2')` na linha do callback | Substituir o bloco `require(...).google.oauth2(...)` por `fetch` direto no endpoint `https://www.googleapis.com/oauth2/v2/userinfo` com header `Authorization: Bearer ${tokens.access_token}` — sem dependência extra | Nunca usar `require('google-auth-library').google.*` — a lib exporta `OAuth2Client`, `GoogleAuth`, etc. diretamente. Para buscar userinfo, usar o `access_token` retornado por `getToken()` com fetch nativo |
| E092 | `ENOENT: no such file or directory, open '/arvores_de_sistemas.md'` no systemsTreeImport | Contexto de build Docker é `./backend`, arquivo está na raiz do repo; após fix do contexto, o estágio `production` não copia o arquivo do estágio `builder` | `docker exec mesas-beta-api find /app -name 'arvores_de_sistemas.md'` retorna vazio | Copiar manualmente via `docker cp` após cada rebuild: `scp arquivo faren:/tmp/ && docker cp /tmp/arquivo container:/app/` | Adicionar `COPY --from=builder /app/arvores_de_sistemas.md ./` no estágio production do Dockerfile |
| E093 | `Nenhum nó válido foi identificado em arvores_de_sistemas.md` no systemsTreeImport | Regex `\[\[(.+)\]\]` captura sem o `[` inicial e trunca no primeiro `]]` interno, causando falha no `JSON.parse` de todos os nós | Script de diagnóstico mostra `JSON ERRO` em todas as linhas capturadas | Corrigir regex em `extractMarkdownNodes` para capturar o array completo incluindo colchetes externos: substituir `\[\[(.+)\]\]` por `(\[\[.+\]\])` e ajustar o `JSON.parse` para incluir os colchetes | — |

---

## Categoria: Imgur / Upload de Imagens

| ID | Sintoma | Causa provável | Diagnóstico rápido | Solução validada | Prevenção |
|---|---|---|---|---|---|
| E079 | Upload de imagem retorna `403 Forbidden` da API do Imgur | `IMGUR_CLIENT_ID` ausente, inválido ou expirado no `.env` | Log da API mostra `Authorization header missing` ou `Invalid client_id` ao chamar `POST /image` | Confirmar `IMGUR_CLIENT_ID` no `.env` com `grep IMGUR_CLIENT_ID /opt/mesas-beta/.env`; validar o Client ID no painel do Imgur; nunca usar valor placeholder do `.env.example` | Verificar presença e validade do `IMGUR_CLIENT_ID` no pre-flight (`PRE-FLIGHT_CHECKLIST.md` passo 6) antes de qualquer tarefa com imagens |
| E080 | Upload retorna `429 Too Many Requests` da API do Imgur | Rate limit de 1250 uploads/dia por Client ID atingido | Log da API mostra `429` na chamada ao Imgur; verificar contagem diária em `imgur_cleanup_log` | Aguardar reset diário do limite (UTC midnight); não tentar novamente na mesma requisição; retornar erro claro ao usuário via Backend | Monitorar volume de uploads diários (`OPS-04` do `TODO_OPERACIONAL.md`); nunca fazer upload em loop sem verificação de rate limit |
| E081 | Imagem deletada do Imgur mas `cover_url` ainda retorna na API pública | CleanupWorker executou a deleção no Imgur mas falhou ao zerar os campos no banco antes de encerrar | `cover_url` na tabela `tables` aponta para link que retorna 404 no Imgur | Zerar manualmente `cover_url`, `cover_deletehash`, `cover_imgur_id` no banco para a mesa afetada; registrar ocorrência em `imgur_cleanup_log` com `status=error` | CleanupWorker deve executar a atualização do banco na mesma transação da confirmação de deleção do Imgur; verificar logs do job após cada ciclo |

---

## Categoria: AggregatorBot / CleanupWorker

| ID | Sintoma | Causa provável | Diagnóstico rápido | Solução validada | Prevenção |
|---|---|---|---|---|---|
| E082 | AggregatorBot silencioso — nenhum log de ciclo após horário agendado | Circuit breaker ativado por falha de conexão com o banco ou com fonte externa; ou variável `AGGREGATOR_CRON_SCHEDULE` ausente/inválida no `.env` | `docker logs mesas-beta-app --tail=50 \| grep aggregator` sem nenhuma entrada após o horário esperado | Verificar `AGGREGATOR_CRON_SCHEDULE` no `.env`; verificar conectividade do container com o banco (`docker exec mesas-beta-app ping mesas-beta-db`); o bot retoma automaticamente no próximo ciclo sem intervenção | Confirmar variável de ambiente e conectividade com o banco no pre-flight; o circuit breaker é comportamento esperado — não forçar retry manual sem diagnóstico |
| E083 | CleanupWorker com erros repetidos — logs com `error` a cada ciclo | `deletehash` nulo ou inválido no banco para mesas com status `ended`/`cancelled`; ou falha de rede com o Imgur | `docker logs mesas-beta-app --tail=50 \| grep cleanup` mostrando `error` repetido; verificar `cover_deletehash IS NULL` no banco para mesas com status encerrado | Identificar registros com `deletehash` nulo via SQL: `SELECT id, cover_deletehash FROM tables WHERE status IN ('ended','cancelled') AND cover_deletehash IS NULL`; zerar `cover_url` e `cover_imgur_id` para esses registros; registrar em `imgur_cleanup_log` com `status=not_found` | Garantir que o pipeline de upload sempre salva `deletehash` no banco antes de confirmar o upload; nunca salvar apenas `cover_url` sem os campos auxiliares |
| E084 | Anúncios importados pelo AggregatorBot duplicando mesas já existentes | Critério de deduplicação não foi aplicado corretamente — `source_url` ou par `title+gm_name+starts_at` coincidindo com registro já existente em `imported_tables` | Verificar em `imported_tables` registros com `source_url` ou título idênticos a registros em `tables`; checar logs de ingestão para entradas classificadas como "novo" quando deveriam ser "duplicado" | Revisar lógica de deduplicação em `dedup.ts` seguindo ordem de prioridade definida em `ARQUITETURA_PROJETO.md` seção 4.5; nunca alterar critério de deduplicação sem autorização explícita | Antes de ativar nova fonte no AggregatorBot, executar dry-run (`POST /admin/aggregator/run` com `dry_run=true`) e revisar preview de duplicatas no painel admin |
