# Feature 013 — Configuracao do Bot Discord via Painel Admin

## Sumario executivo

Permite que administradores configurem o token do bot Discord diretamente no painel "Discord Sync", sem acesso SSH e sem reiniciar o backend. O token salvo no banco e cifrado com AES-256-GCM e nunca e retornado em plaintext.

## Mudancas por componente

- **Database:** adiciona `database/migration_116_discord_settings.sql` com tabela `discord_settings`, indice unico parcial para configuracao global e validacao final.
- **Backend:** adiciona cifra/decifra isolada, leitura do token em ordem DB -> `DISCORD_BOT_TOKEN`, endpoints admin de settings e uso do token resolvido em `/fetch`.
- **Frontend:** adiciona aba "Configuracao" antes de "Fontes", status mascarado, campo de senha, salvar token e remocao com confirmacao inline.
- **Documentacao:** atualiza `MAPA_DE_API.md` e artefatos SDD da feature 013.

## Testing evidence

- `npm --prefix backend run build`: GREEN.
- `npm --prefix frontend run build`: GREEN.
- Busca final de vazamento: nenhuma ocorrencia de log com token; ocorrencias restantes sao nomes de schema/helper, fallback `DISCORD_BOT_TOKEN`, aviso de UI e variavel interna de cifra.

## Checklist pos-merge

- Conferir deploy automatico em `dev`.
- Confirmar aplicacao da migration 116 no Beta.
- Testar em janela anonima no Beta: salvar token, ver preview mascarado, buscar mensagens sem restart, remover token e validar fallback.
- Registrar qualquer falha funcional via bugfix SDD antes de promover para producao.
