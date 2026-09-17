# Implementation Plan: Painel admin dos noivos

**Branch**: `001-admin-content-panel` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-admin-content-panel/spec.md`

## Summary

Área `/admin` com login compartilhado do casal (identificador + senha, sessão de 8h) para CRUD de presentes (título, descrição, Pix, imagem, valor opcional), fotos da capa (máx. 8) e de Nossa História (máx. 12), e blocos de texto do site. Persistência em Neon Postgres (já aprovado) via Drizzle; imagens novas no Google Drive já configurado, exibidas no site público por um proxy do próprio app. Conteúdo atual é copiado uma vez no seed. Publicação é imediata (`revalidatePath('/')`). Sem NextAuth, sem CMS, sem biblioteca de formulários.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.2 (App Router), React 19.2 — modo `strict`

**Primary Dependencies**: App Router (RSC + Server Actions + Route Handlers), shadcn/ui `base-nova`, `@neondatabase/serverless`, `drizzle-orm` + `drizzle-kit` (dev), Drive API já existente em `lib/drive-*`. Sem Zod, sem NextAuth, sem lib de forms.

**Storage**: Neon Postgres (Vercel Marketplace, free tier, pooled `DATABASE_URL`). Imagens: arquivos estáticos atuais em `public/` no seed; uploads novos no Drive (OAuth já usado pelo álbum de convidados). Sessão: cookie httpOnly assinado (sem tabela de sessão).

**Testing**: `npm run lint` + `npm run build` (portão constitucional). Validação manual no quickstart (login, presente, foto, texto, 360px). Sem framework de teste novo.

**Target Platform**: Vercel Hobby + Neon Free + Google Drive. Preview deployments com branch de banco separada.

**Project Type**: Web app Next.js existente (brownfield)

**Performance Goals**: Home pública LCP < 2.5s / CLS < 0.1 (constituição VII). Login < 10s. Convidado vê conteúdo novo em ≤ 1 min (na prática, na próxima visita após `revalidatePath`).

**Constraints**: Custo zero; sem `NEXT_PUBLIC_` de segredo; body de Server Action na Hobby ~4.5MB → upload de foto via sessão resumível (cliente PUT no Drive, sessão iniciada no servidor); `cookies()` assíncrono; auth de borda em `proxy.ts` (middleware deprecated no Next 16).

**Scale/Scope**: 1 casal, dezenas de presentes/fotos/textos, pico na semana do casamento. Rotas: `/admin/login` + 3 áreas. Homepage pública passa a ler o banco com fallback para `data/` se o banco cair.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Notas |
|-----------|--------|--------|
| I. Custo Zero | Pass | Nenhum serviço novo. Neon Free (já ratificado) + Drive existente. Spending limit zero. Pico: dezenas de linhas/arquivos. Estouro = bloqueio de escrita, não cobrança. |
| II. Estático primeiro | **Exceção justificada** | Autores são os noivos, não o git. Spec FR-013. Ver Complexity Tracking. |
| III. Server-First | Pass | Páginas admin RSC; `"use client"` só em form/reorder/confirm/file. Mutações = Server Actions. Cliente não faz `fetch` ao banco nem ao Drive, exceto PUT da URL de sessão resumível de uso único (já exigido pela constituição para upload). |
| IV. Fronteira de integração | Pass | `lib/db`, `lib/content/*`, `lib/admin-auth`, `lib/site-media`, `lib/drive-*`. Componentes e `app/admin` não importam SDK Neon/Drive. |
| V. Segredos no servidor | Pass | `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` sem `NEXT_PUBLIC_`. Validação + rate limit no login. Cookie httpOnly/Secure/SameSite=Lax. |
| VI. Degradação de convidados | Pass (não é RSVP) | Leitura pública: se Neon falhar, fallback para JSON/`public` já no repo. Escrita admin falha com mensagem, não corrompe o público. |
| VII. Mobile-first | Pass | Painel 360px; `next/image` nas fotos públicas; Drive proxy não bloqueia LCP da home (máx. 8 capas). |
| VIII. LGPD | Pass | Sem analytics. Logs sem senha/Pix completo. Área admin `noindex` + `robots.txt` Disallow `/admin`. |
| IX. Simplicidade | Pass | Sem CMS, sem NextAuth, sem lib de forms, sem store global. Drizzle permitido pela constituição. Um login compartilhado. |

**Pós-design (Phase 1):** os contratos não introduzem provedor novo nem auth library. A exceção ao II permanece a única; proxy de mídia e cookie stateless não violam IX (código próprio, terceiro caso de Drive já existia). GATE passa.

## Project Structure

### Documentation (this feature)

```text
specs/001-admin-content-panel/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── admin-auth.md
│   ├── content.md
│   └── site-media.md
└── spec.md
```

### Source Code (repository root)

```text
app/
├── page.tsx                          # lê conteúdo via lib/content (DB + fallback)
├── admin/
│   ├── login/page.tsx
│   └── (panel)/
│       ├── layout.tsx                # exige sessão; senão redirect /admin/login
│       ├── page.tsx                  # índice das três áreas
│       ├── presentes/page.tsx
│       ├── fotos/page.tsx
│       └── textos/page.tsx
├── api/
│   ├── presentes/[id]/route.ts       # Pix: passa a ler o banco
│   ├── admin/media/session/route.ts  # inicia resumível Drive (cookie)
│   ├── admin/media/complete/route.ts
│   └── site-media/[id]/route.ts      # GET público, stream do Drive ou static
├── actions/
│   ├── admin-auth.ts
│   ├── gifts.ts
│   ├── photos.ts
│   └── texts.ts
components/
├── admin/                            # pedaços de UI do painel (shadcn)
└── (públicos existentes leem props, não o SDK)
lib/
├── db/client.ts
├── db/schema.ts
├── content/gifts.ts
├── content/photos.ts
├── content/texts.ts
├── content/seed.ts
├── content/public.ts                 # leitura pública + fallback
├── admin-auth.ts
└── site-media.ts
drizzle.config.ts
drizzle/                              # SQL versionado, apply explícito
proxy.ts                              # matcher /admin/:path* (exceto login)
scripts/hash-admin-password.mjs
```

**Structure Decision**: App Router único já existente. Admin é route group em `app/admin`. Domínio em `lib/content` e `lib/db`. Sem pacote separado.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| II. Editorial no banco (presentes, fotos de site, textos geridos) | Noivos publicam sem commit. FR-013. | JSON em `data/` exige o mantenedor. Planilha não cobre imagem nem painel no celular. CMS externo é PROIBIDO (IX). |
| Cookie de sessão próprio | Constituição IX proíbe camada de auth de produto; IX permite auth dos noivos. | NextAuth/Clerk = dependência extra + risco de plano pago. Link mágico exige e-mail. |
| Proxy `/api/site-media` | Drive não é CDN público seguro; FR-015 pede pasta restrita e URL não adivinhável. | `anyone with the link` no Drive vaza listagem; Vercel Blob é serviço novo (I). |
