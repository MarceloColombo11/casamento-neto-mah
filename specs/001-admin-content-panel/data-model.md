# Data Model: Painel admin dos noivos

Persistência: Neon Postgres. Tipos TypeScript espelham o schema Drizzle. Remoção de presente/foto é DELETE físico.

## Enums

- `media_source`: `static` | `drive` | `db`
- `photo_collection`: `hero` | `historia`
- `text_block_key`: `hero_message` | `grande_dia` | `traje` | `nossa_historia` | `presentes_intro`

## site_media

Arquivo de imagem referenciável.

| Campo | Tipo | Regras |
|-------|------|--------|
| id | uuid PK | gerado no servidor |
| source | media_source | obrigatório |
| static_path | text null | obrigatório se source=static; path público `/images/...` |
| drive_file_id | text null | obrigatório se source=drive (legado) |
| mime | text | `image/jpeg` \| `image/png` \| `image/webp` |
| byte_size | int | 1…4_194_304 nos uploads novos |
| bytes | bytea null | obrigatório se source=db |
| created_at | timestamptz | default now() |

**URL pública:** `/api/site-media/{id}` (UUID, não sequencial).

## gifts

| Campo | Tipo | Regras |
|-------|------|--------|
| id | uuid PK | |
| title | text | 1…120, trim, obrigatório |
| description | text | 1…2000, obrigatório |
| pix | text null | vazio ou Pix copia e cola (começa com `000201`, contém `BR.GOV.BCB.PIX`, até 512 chars) |
| suggested_value | text null | 0…40 chars (ex. `R$ 100,00`) |
| media_id | uuid null FK site_media | on delete set null |
| sort_order | int | ≥ 0, único na prática via rewrite da lista |
| created_at / updated_at | timestamptz | |

**Delete:** `DELETE FROM gifts WHERE id=?` + mídia órfã apagada se não referenciada.

**Ordem:** action recebe array de ids; rewrite `sort_order` 0..n-1 numa transação.

## site_photos

| Campo | Tipo | Regras |
|-------|------|--------|
| id | uuid PK | |
| collection | photo_collection | |
| media_id | uuid FK site_media | not null |
| sort_order | int | ≥ 0 |
| created_at | timestamptz | |

**Limites:** count(hero) ≤ 8; count(historia) ≤ 12. Enforce no service antes do INSERT.

**Delete:** DELETE da row + site_media se órfã + tentativa de apagar arquivo Drive (falha Drive não desfaz o DELETE local; log opaco).

## site_text_blocks

Uma row por `text_block_key`.

| Campo | Tipo | Regras |
|-------|------|--------|
| key | text PK | enum acima |
| payload | jsonb | ver formas abaixo |
| updated_at | timestamptz | |

**payload por key:**

- `hero_message`: `{ "value": string }` 1…500
- `presentes_intro`: `{ "value": string }` 1…500
- `grande_dia` / `traje`: `{ "paragraphs": string[] }` cada 1…2000, length ≥ 1
- `nossa_historia`: `{ "titulo": string, "subtitulo": string, "assinatura": string, "paragraphs": string[] }` titulo/subtitulo/assinatura 1…120; paragraphs ≥ 1

Não há lixeira de parágrafo: o array salvo substitui o anterior.

## admin_login_attempts

| Campo | Tipo | Regras |
|-------|------|--------|
| id | bigserial PK | |
| ip_hash | text | SHA-256 do IP + pepper `ADMIN_SESSION_SECRET` |
| attempted_at | timestamptz | default now() |
| success | boolean | |

Consultas: count success=false nos últimos 15 min por `ip_hash`. Purge ocasional de linhas > 24h (pode ser na própria action de login).

## content_seed

| Campo | Tipo | Regras |
|-------|------|--------|
| id | text PK | valor `'v1'` |
| seeded_at | timestamptz | |

Insert `'v1'` na mesma transação do copy inicial. Segunda chamada no-op.

## Sessão (não persistida)

Cookie `admin_session` = `base64url(payload).hex(hmac)`.

```json
{ "iat": 1770000000, "exp": 1770028800 }
```

`exp = iat + 28800`. HMAC com `ADMIN_SESSION_SECRET`. Sem user id (um único casal).

## Relacionamentos

```
site_media 1──* gifts (media_id)
site_media 1──* site_photos (media_id)
site_text_blocks — independente
content_seed — independente
admin_login_attempts — independente
```

## Estado

Presente/foto: **existe** ou **não existe**. Sem `hidden`. Texto: sempre existe depois do seed (5 keys).

## Seed mapping

| Origem hoje | Destino |
|-------------|---------|
| `data/presentes.json` | gifts (+ site_media static se `/imagensPresentes/{id}.jpeg` existir) |
| `HERO_IMAGES` únicos | site_photos collection=hero |
| `sobre-nos.json` | nossa_historia + fotos historia (hoje []) |
| Copy hardcoded Grande Dia / Traje / intro presentes / mensagem home | text blocks |

## Fallback público (banco indisponível)

Mesmas origens do seed, lidas do filesystem. Não escreve seed. Painel admin não usa fallback para mutação.
