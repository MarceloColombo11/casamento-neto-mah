# Contract: Mídia do site

Uploads do painel vão para o Neon (`site_media.bytes`). O cliente não fala com o Google Drive. O álbum dos convidados continua no Drive.

## `POST /api/admin/media/upload`

**Auth:** cookie `admin_session`.

**Body:** `multipart/form-data` com campo `file`.

**Regras:** mime ∈ jpeg/png/webp; 0 < size ≤ 4_194_304; origin permitido (mesmo helper do RSVP).

**200:** `{ mediaId, publicUrl }` onde `publicUrl` = `/api/site-media/{mediaId}`.

Grava `site_media` com `source=db` e os bytes da imagem.

**401/403/400:** sem sessão / origin / arquivo inválido.

## `GET /api/site-media/[id]`

**Auth:** nenhuma (UUID opaco).

**200:** bytes + Content-Type. Cache-Control `public, max-age=3600`.

**404:** id inexistente.

**502:** Drive indisponível para source=drive legado — corpo vazio/erro; a página pública deve ter `onError`/fundo simples, não quebrar a home.

**db:** devolve os bytes guardados no Neon.

**static:** serve/redirect o path em `public/`.

Não listar diretório. Não aceitar `?file=` com path.
