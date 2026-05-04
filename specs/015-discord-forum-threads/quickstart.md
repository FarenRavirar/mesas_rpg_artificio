# Quickstart: Discord Forum Threads

## Pre-condicoes

1. Branch `feat/015-discord-forum-threads`.
2. Token do bot configurado no painel admin.
3. Bot instalado em servidor com ao menos um canal de forum visivel.

## Validacao tecnica local

1. Aplicar implementacao da Feature 015.
2. Executar:

```powershell
npm --prefix backend run build
npm --prefix frontend run build
```

3. Executar buscas finais:

```powershell
rg -n "AbortSignal\\.timeout" backend/src/discord backend/src/routes/adminDiscordSync.ts
rg -n "console\\.(log|error).*token|plaintext|DISCORD_BOT_TOKEN" backend/src/discord backend/src/routes/adminDiscordSync.ts frontend/src/features/discord-sync --glob "*.ts" --glob "*.tsx"
```

## Validacao funcional em Beta

1. Abrir `https://mesasbeta.artificiorpg.com` em janela anonima.
2. Entrar como admin via Google OAuth.
3. Abrir `/gestao` > Discord Sync > Fontes.
4. Selecionar servidor e canal marcado como forum.
5. Cadastrar fonte.
6. Executar "Buscar mensagens".
7. Confirmar que mensagens de posts/threads aparecem em Mensagens.
8. Reexecutar a busca e confirmar que nao aparecem duplicatas.
9. Testar fonte textual/anuncio existente e confirmar funcionamento.

## Rollback

1. Reverter commit da feature.
2. Se a migration ja tiver sido aplicada, manter colunas extras sem uso; elas sao aditivas e nao quebram runtime.
3. Em caso de emergencia com schema, seguir `migrations_guide.md` e `PRE_DEPLOY_CHECKLIST.md` antes de qualquer acao manual.
