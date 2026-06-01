# Quickstart 013 — Discord Settings Config

## Validacao Tecnica Local

1. Confirmar numero da migration:

```powershell
Get-ChildItem database -Filter 'migration_*.sql' | Sort-Object Name | Select-Object -Last 10 Name
```

2. Conferir que `database/migration_116_discord_settings.sql` tem header obrigatorio e comandos idempotentes.

3. Build backend:

```powershell
npm --prefix backend run build
```

4. Build frontend:

```powershell
npm --prefix frontend run build
```

5. Busca de seguranca:

```powershell
rg -n "console\\.(log|error).*token|plaintext|botToken" backend/src/discord backend/src/routes/adminDiscordSync.ts
```

## Validacao Funcional em Beta

Depois de merge/deploy em `dev`:

1. Abrir `https://mesasbeta.artificiorpg.com` em janela anonima.
2. Entrar como admin via Google OAuth.
3. Acessar `/gestao` e abrir "Discord Sync".
4. Na aba "Configuracao", salvar token valido.
5. Confirmar que o badge muda para configurado e mostra apenas preview mascarado.
6. Usar "Fontes" para buscar mensagens; a ingestao deve funcionar sem restart do backend.
7. Remover token via confirmacao inline.
8. Confirmar que a UI volta para "Token nao configurado" e que o sistema passa a depender do fallback `DISCORD_BOT_TOKEN`.
