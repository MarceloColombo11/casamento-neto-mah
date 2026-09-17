# Contract: Mídia do site

Cliente **não** monta URL do Drive nem envia Bearer Google. Só PUT na `uploadUrl` de uso único devolvida pelo servidor (padrão já usado no álbum de convidados).

## `POST /api/admin/media/session`

**Auth:** cookie `admin_session`.

**Body JSON:** `{ fileName, mimeType, size, origin }`

**Regras:** mime ∈ jpeg/png/webp; 0 < size ≤ 8_388_608; origin permitido (mesmo helper do RSVP).

**200:** `{ uploadUrl, pendingToken }`

`pendingToken` é HMAC de `{ driveFileId or sessionId, exp: now+10min }` — o complete valida.

**401/403/429:** sem sessão / origin / rate.

## `POST /api/admin/media/complete`

**Auth:** cookie.

**Body JSON:** `{ pendingToken }`

Servidor confirma o arquivo no Drive, INSERT `site_media` source=drive, retorna `{ mediaId, publicUrl }` onde `publicUrl` = `/api/site-media/{mediaId}`.

Se o PUT do cliente não terminou: 409 `{ error: "Upload incompleto. Tente de novo." }` — não cria gift/photo.

## `GET /api/site-media/[id]`

**Auth:** nenhuma (UUID opaco).

**200:** bytes + Content-Type. Cache-Control `public, max-age=3600`.

**404:** id inexistente.

**502:** Drive indisponível para source=drive — corpo vazio/erro; a página pública deve ter `onError`/fundo simples, não quebrar a home.

**static:** serve/redirect o path em `public/`.

Não listar diretório. Não aceitar `?file=` com path.
