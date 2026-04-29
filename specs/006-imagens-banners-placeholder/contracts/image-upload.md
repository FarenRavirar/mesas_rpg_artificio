# Contract: Image Upload and External URL Reupload

## Existing Contract

### POST `/api/v1/upload`

Uploads authenticated image files through the backend to the approved image host.

**Request**
- Authenticated request.
- `multipart/form-data`.
- Field: `file`.
- Accepted formats: JPG, PNG, WEBP.
- Max size: 5 MB.

**Success Response**

```json
{
  "secure_url": "https://res.cloudinary.com/.../image.webp",
  "public_id": "mesas_rpg/..."
}
```

**Error Response**

```json
{
  "error": "Mensagem compreensível para o usuário"
}
```

## Planned Extension

### POST `/api/v1/upload/url`

Reuploads an authenticated external image URL through the backend to the approved image host.

**Request**

```json
{
  "url": "https://example.com/temp-image.jpg",
  "purpose": "table_banner"
}
```

**Rules**
- Requires authentication.
- Backend validates URL scheme and response content type.
- Backend enforces max download size equivalent to file upload policy.
- Backend uploads the fetched image/source URL to the approved image host.
- Backend returns durable `secure_url`.
- Backend does not expose provider delete metadata.

**Success Response**

```json
{
  "secure_url": "https://res.cloudinary.com/.../image.webp",
  "public_id": "mesas_rpg/..."
}
```

**Error Response**

```json
{
  "error": "Não foi possível importar a imagem desse link."
}
```

## Compatibility

- Existing multipart upload must continue working unchanged.
- Existing saved Cloudinary URLs must not be reuploaded unnecessarily.
- Existing non-Cloudinary URLs remain displayable until explicit migration/backfill is approved.
- Profile image URL fields may opt out of reupload when the user explicitly enables `Manter link direto`.

## Profile Direct-Link Opt-Out

For profile images, the UI may expose an explicit opt-out from automatic reupload.

**Control label**

`Manter link direto`

**Tooltip/help text**

`Ao ativar esta opção, a imagem será exibida a partir do endereço informado, sem cópia para nossa hospedagem. Se esse link sair do ar ou expirar, a imagem poderá deixar de aparecer.`

**Behavior**
- Off by default.
- When off, external URLs should be imported through the backend whenever possible.
- When on, the submitted URL remains direct and the backend must not reupload it automatically.
- The choice applies to profile images only unless a later spec explicitly expands it to table banners.
