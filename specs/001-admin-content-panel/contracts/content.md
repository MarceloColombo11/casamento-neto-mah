# Contract: Conteúdo gerido (Server Actions)

Todas exigem sessão. Validação no servidor antes de qualquer write. Sucesso chama `revalidatePath('/')`. Erros de domínio: `{ ok: false, error: string }` em português. Nunca retornar Pix em listagens públicas (só no GET de Pix e no form admin).

## Presentes — `app/actions/gifts.ts`

### `listGifts()` (só painel)

Retorna `{ id, title, description, pix, suggestedValue, imageUrl, sortOrder }[]` ordenado. `imageUrl` = `/api/site-media/{mediaId}` ou null.

### `createGift(formData)`

Campos: `title`, `description`, `pix?`, `suggestedValue?`, `mediaId?`.  
Rejeita title/description vazios. Pix: vazio ou código copia e cola (BR Code, até 512 caracteres).  
Insert no fim da lista (`max(sort_order)+1`).

### `updateGift(formData)`

Campos: `id` + mesmos do create. Não duplica row.

### `deleteGift(formData)`

Campo: `id`. DELETE definitivo. Confirmação é só UI (dialog) antes de chamar a action.

### `reorderGifts(formData)`

Campo: `ids` JSON array. Rewrite sort_order. Rejeita se o set de ids ≠ set persistido.

## Fotos — `app/actions/photos.ts`

### `listPhotos(collection: 'hero' | 'historia')`

### `addPhoto(formData)`

`collection`, `mediaId`. Rejeita se count(hero)=8 ou count(historia)=12.

### `deletePhoto(formData)`

`id`. DELETE definitivo.

### `reorderPhotos(formData)`

`collection`, `ids` JSON array.

## Textos — `app/actions/texts.ts`

### `getTextBlocks()`

Cinco keys. `nossa_historia` / `grande_dia` / `traje` incluem `paragraphs: string[]`.

### `saveTextBlock(formData)`

`key` + payload. Rejeita paragraphs vazio nos blocos com lista. Campos únicos não aceitam string vazia.

## Pix público (já existente, contrato muda a fonte)

### `GET /api/presentes/[id]`

**Auth:** nenhuma.

**200:** `{ chavePix: string }` só se o presente existe e pix não vazio.

**404:** id inválido, inexistente ou sem pix.

**500:** falha de leitura (não vaza stack). Fallback: se DB down, tenta JSON legado.

Não lista todos os Pix.
