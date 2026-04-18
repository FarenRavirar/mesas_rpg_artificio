# Sessão: Refatoração do guia Cloudinary

## 1) Objetivo da sessão
Executar a migração Cloudinary em 3 blocos, com foco atual em:
- Bloco 1: reescrita do guia técnico alinhado ao código real.
- Bloco 2: implementação frontend do upload no `StepFinal.tsx`.

## 2) Plano de execução
1. Levantar contratos reais backend/frontend para upload e persistência de imagem.
2. Reescrever o guia com arquitetura alvo, mitigação de falhas e rollback.
3. Implementar componente de upload (`ImageUploader`) no frontend.
4. Integrar `ImageUploader` no `StepFinal.tsx` sem quebrar contrato `banner_url`.
5. Adicionar variáveis públicas de ambiente no `frontend/.env.example`.
6. Atualizar checklist da sessão.

## 3) Task list (checklist)
- [x] Mapear rotas reais relacionadas a imagens e publicação de mesa.
- [x] Mapear pontos de frontend que enviam/consomem `banner_url`.
- [x] Identificar campos de schema legados de Imgur ainda existentes.
- [x] Reescrever `CLOUDINARY_INTEGRATION_GUIDE.md` com base no estado real.
- [x] Revisar riscos e severidades dentro do novo guia.
- [x] Validar consistência com `MAPA_DE_API.md`.
- [x] Criar `frontend/src/components/ImageUploader.tsx`.
- [x] Integrar upload no `frontend/src/components/form-steps/steps/StepFinal.tsx`.
- [x] Criar `frontend/.env.example` com variáveis Cloudinary públicas.
- [x] Ajustar `frontend/.gitignore` para ignorar `.env*` e manter `.env.example`.
- [x] Atualizar status desta checklist após edição.
- [ ] Atualizar RESUMO_EXECUCAO.md apontando para esta sessão.

## 5) Critério de conclusão
- Guia reescrito com:
  - contratos reais (`/api/v1/gm/*`),
  - fluxo Cloudinary sem vazamento de segredo,
  - mitigação de falhas com severidade,
  - plano de rollback executável,
  - instruções de teste e validação.
- Nenhuma referência operacional incorreta ao endpoint `gm-panel`.
