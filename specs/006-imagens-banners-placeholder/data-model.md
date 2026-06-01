# Data Model: Imagens, Banners e Placeholders

## Table Image

Representa a imagem pública de uma mesa.

**Fields in current model**
- `tables.banner_url`: fonte canônica da imagem de mesa.
- `tables.banner_crop_data`: coordenadas de crop visual.
- `tables.cover_url`: campo legado ainda presente em alguns contratos.
- `tables.cover_source_type`, `tables.cover_origin_url`: metadados legados/compatibilidade de origem externa quando existentes.

**Validation rules**
- URL pública deve ser URL válida.
- URL final usada em anúncio público deve preferencialmente apontar para hospedagem durável aprovada.
- Falha de reupload não deve gerar `deletehash` público nem quebrar resposta pública.

**State transitions**
- `manual_external_url` -> `persisted_cloudinary_url` quando backend baixa/reenvia com sucesso.
- `manual_external_url` -> `reupload_failed` quando backend não consegue validar/baixar a imagem.
- `missing_or_failed_url` -> `placeholder` somente na camada de exibição.

## Master Public Image

Representa imagens do perfil público do mestre.

**Fields in current model**
- `gm_profiles.avatar_url`
- `gm_profiles.banner_url`
- fallback de avatar por `profiles.avatar_url`

**Validation rules**
- Avatar/banner de mestre seguem a mesma política de fonte durável quando recebidos por upload.
- Fallback visual não deve substituir uma URL válida antes de tentativa de carregamento.
- Perfil pode guardar URL direta quando o usuário marca explicitamente a opção de manter link direto.
- Quando a opção de link direto está ativa, o sistema não deve reupar a imagem automaticamente.

**User-facing copy**
- Label: `Manter link direto`
- Tooltip: `Ao ativar esta opção, a imagem será exibida a partir do endereço informado, sem cópia para nossa hospedagem. Se esse link sair do ar ou expirar, a imagem poderá deixar de aparecer.`

## Banner Resolution

Decisão de qual imagem exibir em uma superfície.

**Inputs**
- URL canônica da entidade (`banner_url`, alias `cover_url`, `image_url` conforme contrato existente).
- Placeholder padrão.
- Estado de erro de carregamento no navegador.
- Crop visual quando disponível.

**Outputs**
- `src` inicial.
- `fallbackSrc`.
- handler consistente para erro de imagem.
- `alt` e estilos de crop preservados por contexto.

## Existing Data Audit

Representa consulta read-only para identificar risco em produção/beta.

**Fields to inspect**
- `tables.id`
- `tables.slug`
- `tables.title`
- `tables.banner_url`
- `tables.cover_url`
- `tables.status`

**Audit categories**
- `banner_url` externo não Cloudinary.
- `banner_url` nulo com `cover_url` preenchido.
- `cover_url` nulo com `banner_url` preenchido, especialmente para página do mestre.
- URL aparentemente temporária por domínio conhecido ou query expirada.
