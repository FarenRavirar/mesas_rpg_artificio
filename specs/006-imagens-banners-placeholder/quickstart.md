# Quickstart: Imagens, Banners e Placeholders

## 1. Confirmar investigação local

```powershell
rg -n "banner_url|cover_url|image_url|banner_placeholder|onError|/upload|Cloudinary" backend/src frontend/src
```

Resultado esperado: pontos de upload, persistência e fallback identificados sem abrir arquivos grandes.

## 2. Validar causa do link direto

Criar ou editar uma mesa usando o campo de URL manual do banner.

Resultado esperado antes da correção: payload envia `banner_url` com a URL digitada e backend persiste a URL sem reupload.

Resultado esperado depois da correção: URL externa é importada pelo backend e `banner_url` final usa URL durável aprovada.

## 3. Validar página pública do mestre

Usar uma mesa com `banner_url` preenchido e `cover_url` nulo.

Resultado esperado antes da correção: perfil público do mestre pode exibir placeholder.

Resultado esperado depois da correção: perfil público do mestre recebe o mesmo alias visual usado por catálogo/detalhe.

## 4. Validar superfícies visuais

Esta validação funcional deve ser executada somente após deploy do branch `dev` para o ambiente beta. As validações locais antes disso cobrem build, testes automatizados e checagens estáticas, mas não substituem o teste real em beta.

Abrir em janela anônima:
- Página principal/listagem recente.
- Catálogo.
- Página pública do mestre.
- Página da mesa.
- Painel do mestre.

Resultado esperado: a mesma mesa exibe banner real nas telas em que existe imagem válida e fallback consistente quando não existe.

## 5. Comandos de validação

Antes do deploy em `dev`, executar validações locais:

```powershell
npm --prefix backend run build
npm --prefix backend test -- --runInBand
npm --prefix frontend run build
git diff --check
```

Depois do deploy em `dev`, executar a validação manual em beta conforme a seção 4.

## 6. Auditoria read-only opcional

Executar somente consultas `SELECT` em beta/produção via SSH, se autorizado no escopo da etapa, para contar URLs externas e divergências `cover_url`/`banner_url`.
