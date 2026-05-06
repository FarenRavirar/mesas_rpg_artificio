# Quickstart: Discord Forum Threads

## Pre-condicoes

1. Branch `feat/015-discord-forum-threads`.
2. Token do bot configurado no painel admin.
3. Bot instalado em servidor com ao menos um canal de forum visivel.
4. Bot com permissoes Discord `View Channels` e `Read Message History`.
5. Aplicacao Discord com `Message Content Intent` ativado. Sem esse intent, a API pode retornar mensagens existentes com `content`, `embeds`, `attachments` e `components` vazios, impossibilitando draft completo.

## Validacao tecnica local

1. Aplicar implementacao da Feature 015.
2. Executar:

```powershell
npm --prefix backend test -- parseDiscordAnnouncement
npm --prefix backend run build
npm --prefix frontend run build
```

3. Executar buscas finais:

```powershell
rg -n "AbortSignal\\.timeout" backend/src/discord backend/src/routes/adminDiscordSync.ts
rg -n "console\\.(log|error).*token|plaintext|DISCORD_BOT_TOKEN" backend/src/discord backend/src/routes/adminDiscordSync.ts frontend/src/features/discord-sync --glob "*.ts" --glob "*.tsx"
```

## Diagnostico direto de conteudo Discord

1. Consultar um post real via `GET /channels/{thread_id}/messages/{message_id}` usando `Authorization: Bot ...`.
2. Confirmar `status=200` e `content.length > 0`.
3. Confirmar `attachments.length` e `embeds.length` como dados auxiliares, sem depender deles para substituir o corpo.
4. Se `content.length = 0` para post que tem corpo visivel no Discord, revisar `Message Content Intent` e permissoes do bot antes de reidratar o banco.
5. Somente depois do diagnostico positivo, reidratar registros antigos; isso e escrita no banco e exige autorizacao quando executado em Beta/producao.

## Validacao funcional em Beta

1. Abrir `https://mesasbeta.artificiorpg.com` em janela anonima.
2. Entrar como admin via Google OAuth.
3. Abrir `/gestao` > Discord Sync > Fontes.
4. Selecionar servidor e canal marcado como forum.
5. Cadastrar fonte.
6. Selecionar janela de tempo coerente com o teste, por exemplo ultimos 7 dias.
7. Executar "Buscar mensagens" ou "Reidratar" somente com autorizacao de deploy/acao mutavel aplicavel ao ambiente.
8. Confirmar que mensagens de posts/threads aparecem em Mensagens com corpo completo, nao apenas `Post sem texto no corpo`.
9. Abrir a mensagem em Apuracao e confirmar que titulo, autor, origem, data, conteudo completo e link "Ver no Discord" estao presentes.
10. Confirmar que apenas starters de thread (`discord_message_id = discord_thread_id`) viram candidatos automaticos a draft; replies com PDF/anexos dentro da thread devem ficar `ignored` ou fora do lote de draft.
11. Executar "Criar Draft" ou parse em lote e confirmar que a aba Drafts mostra registros.
12. Abrir o draft, conferir campos estruturados, editar o que faltar e salvar.
13. Confirmar que "Sincronizar para mesa" permanece bloqueado enquanto faltar titulo, descricao, sistema, tipo, modalidade, preco, vagas, contato, dia ou horario.
14. Confirmar que o sistema foi resolvido pelo campo `Sistema:` do corpo. Titulo/cenario da thread nao deve virar sugestao automatica quando o corpo informa outro sistema.
15. Se o campo `Sistema:` trouxer nome nao cadastrado, confirmar que uma sugestao automatica aparece em Gestao > Sugestoes de Sistemas e que o draft permanece em revisao ate aprovacao/seleção manual.
16. Quando o draft estiver `ready`, sincronizar e confirmar que a mesa nasce como `tables.status='draft'`, sem publicacao automatica.
17. Na aba Sugestoes de Sistemas, selecionar sugestoes pendentes individualmente, usar "Selecionar todas pendentes" e descartar selecionadas sem preencher motivo.
18. Reexecutar a busca e confirmar que nao aparecem duplicatas.
19. Testar fonte textual/anuncio existente e confirmar funcionamento.

## Rollback

1. Reverter commit da feature.
2. Se a migration ja tiver sido aplicada, manter colunas extras sem uso; elas sao aditivas e nao quebram runtime.
3. Em caso de emergencia com schema, seguir `migrations_guide.md` e `PRE_DEPLOY_CHECKLIST.md` antes de qualquer acao manual.
