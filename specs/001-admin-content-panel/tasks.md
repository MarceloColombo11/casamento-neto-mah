---
description: "Task list for painel admin dos noivos"
---

# Tasks: Painel admin dos noivos

**Input**: Design documents from `/specs/001-admin-content-panel/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Não solicitados na spec — sem fase de testes automatizados. Portão: `npm run lint` + `npm run build` + quickstart.md.

**Organization**: Por user story. Sem TDD.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode em paralelo (arquivo diferente, sem depender de tarefa incompleta)
- **[Story]**: US1–US4 da spec
- Toda descrição inclui caminho de arquivo

## Path Conventions

App Router na raiz (`app/`, `lib/`, `components/`), conforme plan.md.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependências e esqueleto de pastas; ainda sem comportamento

- [X] T001 Create directories `app/admin/login/`, `app/admin/(panel)/presentes/`, `app/admin/(panel)/fotos/`, `app/admin/(panel)/textos/`, `app/actions/`, `app/api/admin/media/session/`, `app/api/admin/media/complete/`, `app/api/site-media/[id]/`, `lib/db/`, `lib/content/`, `components/admin/`, `drizzle/`
- [X] T002 Add production deps `@neondatabase/serverless` and `drizzle-orm` plus devDep `drizzle-kit` in `package.json` (keep lockfile)
- [X] T003 Add `drizzle.config.ts` at repo root pointing schema to `lib/db/schema.ts` and output to `drizzle/`
- [X] T004 [P] Document `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` (no values) in `.env.local.example`
- [X] T005 [P] Create scrypt hash helper `scripts/hash-admin-password.mjs`
- [X] T006 Add npm scripts `db:generate` and `db:migrate` in `package.json` (explicit migrate only, never from `next build`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Banco, sessão, proxy, mídia e leitura pública — bloqueia todas as stories

**⚠️ CRITICAL**: Nenhuma user story começa antes deste checkpoint

- [X] T007 Define Drizzle tables (`site_media`, `gifts`, `site_photos`, `site_text_blocks`, `admin_login_attempts`, `content_seed`) in `lib/db/schema.ts`
- [X] T008 Create Neon serverless client in `lib/db/client.ts` using pooled `DATABASE_URL` (no SDK leak to UI)
- [X] T009 Generate versioned SQL migration in `drizzle/` from `lib/db/schema.ts` (apply only via `npm run db:migrate`)
- [X] T010 [P] Implement payload validators (title/pix/mime/size/collection limits/paragraphs) in `lib/content/validation.ts`
- [X] T011 [P] Implement HMAC session cookie + scrypt verify in `lib/admin-auth.ts` (8h `exp`, Path `/`, httpOnly, `cookies()` async)
- [X] T012 [P] Implement public media URL helper in `lib/site-media.ts`
- [X] T013 Implement idempotent seed `v1` (presentes.json, hero únicos, sobre-nos, textos hardcoded) in `lib/content/seed.ts`
- [X] T014 Implement public read with DB then filesystem fallback in `lib/content/public.ts`
- [X] T015 Create Next 16 `proxy.ts` matcher `/admin` and `/admin/:path*` excluding `/admin/login`, redirect if cookie invalid
- [X] T016 Implement `GET` stream/static in `app/api/site-media/[id]/route.ts`
- [X] T017 Implement authenticated resumable start in `app/api/admin/media/session/route.ts` (Origin check, jpeg/png/webp, max 8MB)
- [X] T018 Implement upload complete → `site_media` insert in `app/api/admin/media/complete/route.ts`
- [X] T019 Add `Disallow: /admin` in `app/robots.ts`

**Checkpoint**: `db:migrate` aplica; `/api/site-media/{uuid}` 404 ok; `/admin/foo` redireciona sem cookie

---

## Phase 3: User Story 1 - Entrar e sair da área dos noivos (Priority: P1) 🎯 MVP

**Goal**: Login compartilhado, sessão 8h, painel vazio com três áreas, logout. Sem conteúdo CRUD ainda.

**Independent Test**: Credenciais certas entram no painel em português; erradas mensagem genérica; 6ª falha em 15 min recusada; Sair exige login de novo; `/admin/presentes` sem cookie cai no login; rota ausente do Navbar.

### Implementation for User Story 1

- [X] T020 [US1] Implement `login` / `logout` Server Actions + rate limit 5/15min via `admin_login_attempts` in `app/actions/admin-auth.ts`
- [X] T021 [P] [US1] Create login form (native form + `useActionState`, shadcn Input/Button) in `components/admin/LoginForm.tsx`
- [X] T022 [US1] Create login page in `app/admin/login/page.tsx` (redirect to `/admin` if session valid)
- [X] T023 [US1] Create panel layout requiring session + `robots: { index: false }` in `app/admin/(panel)/layout.tsx`
- [X] T024 [US1] Create panel home with links Presentes / Fotos / Textos and Sair in `app/admin/(panel)/page.tsx`
- [X] T025 [US1] Create placeholder routes so nav does not 404 in `app/admin/(panel)/presentes/page.tsx`, `app/admin/(panel)/fotos/page.tsx`, `app/admin/(panel)/textos/page.tsx`

**Checkpoint**: US1 testável sozinha. Placeholders das outras áreas só dizem “em breve”.

---

## Phase 4: User Story 2 - Gerir a lista de presentes (Priority: P1)

**Goal**: CRUD de presentes (título, descrição, Pix, imagem, valor opcional, ordem). Home pública lê o banco. Pix só no GET por id.

**Independent Test**: Autenticado, criar/editar/reordenar/apagar (confirm) um presente; janela anônima vê a lista; Pix copia no modal; delete é definitivo; lista vazia mostra “lista em preparação”.

### Implementation for User Story 2

- [X] T026 [US2] Implement gift domain (list/create/update/delete/reorder, hard delete) in `lib/content/gifts.ts`
- [X] T027 [US2] Implement gift Server Actions + `revalidatePath('/')` in `app/actions/gifts.ts`
- [X] T028 [US2] Switch Pix lookup from `data/presentes.json` to DB with JSON fallback in `app/api/presentes/[id]/route.ts`
- [X] T029 [P] [US2] Create gift form (fields + media session PUT + complete) in `components/admin/GiftForm.tsx`
- [X] T030 [P] [US2] Create gift cards list with up/down reorder and confirm-delete dialog in `components/admin/GiftList.tsx`
- [X] T031 [US2] Replace presentes placeholder with full CRUD UI in `app/admin/(panel)/presentes/page.tsx`
- [X] T032 [US2] Load gifts via `lib/content/public.ts` in `app/page.tsx` (omit pix from grid props)
- [X] T033 [US2] Use managed `imageUrl` (or generic visual) instead of `/imagensPresentes/{id}.jpeg` in `components/GiftCard.tsx`
- [X] T034 [US2] Render empty-list copy (not example leftovers after delete-all) in `components/GiftsSection.tsx`

**Checkpoint**: US1 e US2 independentes. Seed v1 mostra os exemplos atuais até o casal apagar.

---

## Phase 5: User Story 3 - Trocar as fotos do site (Priority: P2)

**Goal**: Coleções Capa (máx 8) e Nossa História (máx 12); upload Drive; home usa as listas geridas.

**Independent Test**: Enviar/reordenar/remover foto da capa e da história; 9ª da capa recusada; capa vazia não quebra a home.

### Implementation for User Story 3

- [X] T035 [US3] Implement photo domain with collection limits in `lib/content/photos.ts`
- [X] T036 [US3] Implement photo Server Actions + `revalidatePath('/')` in `app/actions/photos.ts`
- [X] T037 [US3] Create collection UI (upload, arrows, confirm delete, limit message) in `components/admin/PhotoCollection.tsx`
- [X] T038 [US3] Replace fotos placeholder in `app/admin/(panel)/fotos/page.tsx`
- [X] T039 [US3] Read hero URLs from `lib/content/public.ts` (fundo simples se vazio) in `components/HeroBackgroundCarousel.tsx`
- [X] T040 [US3] Read história carousel URLs from public content in `components/AboutSection.tsx` / `app/page.tsx`

**Checkpoint**: Fotos do painel aparecem na home sem commit em `public/`

---

## Phase 6: User Story 4 - Editar os textos do site (Priority: P2)

**Goal**: Blocos nomeados; parágrafos um a um em Grande Dia, Traje e Nossa História; campos únicos nos demais.

**Independent Test**: Editar Traje, adicionar parágrafo, recusar salvar história sem parágrafo; home mostra o texto novo.

### Implementation for User Story 4

- [X] T041 [US4] Implement text-block domain (five keys, paragraph rules) in `lib/content/texts.ts`
- [X] T042 [US4] Implement text Server Actions + `revalidatePath('/')` in `app/actions/texts.ts`
- [X] T043 [US4] Create block editor with add/remove paragraph controls in `components/admin/TextBlockEditor.tsx`
- [X] T044 [US4] Replace textos placeholder in `app/admin/(panel)/textos/page.tsx`
- [X] T045 [US4] Pass managed copy into `components/GrandeDiaSection.tsx`, `components/TrajeSection.tsx`, `components/AboutSection.tsx`, `components/GiftsSection.tsx` intro, and hero message in `app/page.tsx`

**Checkpoint**: Placeholder copy do site é editável no painel

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Portões constitucionais e quickstart

- [X] T046 [P] Extract shared Origin allowlist used by RSVP and admin media into `lib/request-origin.ts` (keep `app/api/rsvp/route.ts` behavior)
- [X] T047 Ensure admin UI usable at 360px (touch targets, no horizontal scroll) in `app/admin/` and `components/admin/`
- [X] T048 Confirm logs omit password and full Pix in `app/actions/admin-auth.ts` and `lib/content/gifts.ts`
- [X] T049 [P] Document Neon migrate + `/admin/login` in `README.md`
- [X] T050 Run `npm run lint` and `npm run build` with zero new warnings
- [X] T051 Execute `specs/001-admin-content-panel/quickstart.md` scenarios (login, gift, photo, text, fallback)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende da Phase 1 — **bloqueia** stories
- **US1 (Phase 3)**: depende da Phase 2
- **US2 (Phase 4)**: depende da Phase 2 **e** do layout/nav da US1 (T023–T025)
- **US3 (Phase 5)**: depende da Phase 2, US1 layout, e rotas de mídia (T017–T018). Independente da US2
- **US4 (Phase 6)**: depende da Phase 2 e US1 layout. Independente de US2/US3
- **Polish (Phase 7)**: depois das stories que forem entregar

### User Story Dependencies

- **US1 (P1)**: após Foundational — MVP de acesso
- **US2 (P1)**: após US1 — primeiro valor de conteúdo (recomendado no mesmo ship que US1)
- **US3 (P2)**: após US1; não precisa de presentes
- **US4 (P2)**: após US1; não precisa de fotos/presentes

### Within Each User Story

- Domínio `lib/content/*` antes de `app/actions/*`
- Actions antes das páginas admin
- Admin antes de ligar a home pública
- Sem testes automatizados nesta lista

### Parallel Opportunities

- Phase 1: T004 e T005 em paralelo
- Phase 2: T010, T011, T012 em paralelo após T007
- US2: T029 e T030 em paralelo após T027
- US3 e US4 em paralelo após US1, por pessoas diferentes
- Phase 7: T046 e T049 em paralelo

---

## Parallel Example: User Story 2

```bash
# Depois de T027:
Task: "Create gift form in components/admin/GiftForm.tsx"
Task: "Create gift list in components/admin/GiftList.tsx"
```

## Parallel Example: User Stories 3 and 4 (após US1)

```bash
Task: "Photo domain + admin in lib/content/photos.ts and app/admin/(panel)/fotos/page.tsx"
Task: "Text domain + admin in lib/content/texts.ts and app/admin/(panel)/textos/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 3 US1
4. **STOP**: validar login/logout/rate limit
5. Para o casal usar de verdade, seguir imediatamente à US2 (também P1)

### Incremental Delivery

1. Setup + Foundational
2. US1 → demo acesso
3. US2 → demo lista de presentes (primeiro valor de produto)
4. US3 → fotos
5. US4 → textos
6. Polish + quickstart

### Parallel Team Strategy

1. Setup + Foundational juntos
2. Dev A: US1 então US2
3. Dev B (após US1): US3
4. Dev C (após US1): US4

---

## Notes

- [P] = arquivos diferentes, sem esperar tarefa incompleta
- Sem NextAuth, Zod, lib de forms ou CMS
- Seed v1 copia exemplos atuais; delete é definitivo
- Cookie Path `/` para alcançar `/api/admin/media`
- `proxy.ts`, não `middleware.ts` (Next 16)
- Commit por tarefa ou por checkpoint de story
