# Research: Painel admin dos noivos

## 1. Persistência: Neon + Drizzle na Vercel

**Decision:** Provisionar Neon via Vercel Marketplace (plano Free). Acesso com `@neondatabase/serverless` e `DATABASE_URL` pooled. Schema e migrations com Drizzle (`drizzle-kit generate` / `drizzle-kit migrate`). Apply só por comando explícito, nunca no `next build`.

**Rationale:** Já ratificado na constituição. Free permanente, spending limit da Vercel em zero. Preview: Neon branch por preview deployment (integração Vercel), nunca copiar produção.

**Alternatives considered:**
- Continuar em `data/*.json` — rejeitado pela spec (casal não commita).
- Google Sheets como fonte — rejeitado (imagem, UX, race).
- Prisma / Supabase / Firebase — PROIBIDOS.
- Vercel KV / Blob como banco — serviço extra, não cobre relações.

**Limites (I):** Neon Free (~0.5 GB storage, compute com scale-to-zero). Volume desta feature: dezenas de linhas + metadados. Estouro = escrita falha, site público cai no fallback JSON. Sem cartão.

## 2. Autenticação sem biblioteca

**Decision:** Um par `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` (scrypt, Node `crypto`). Cookie `admin_session` httpOnly, Secure em produção, SameSite=Lax, Path=`/` (precisa alcançar `/api/admin/media`), Max-Age=8h, valor HMAC-SHA256 do payload `{ iat, exp }` com `ADMIN_SESSION_SECRET`. Logout apaga o cookie. `cookies()` é async no Next 16.

**Rationale:** Docs oficiais mostram form + Server Action; a constituição IX proíbe NextAuth/Clerk. Sessão stateless casa com “8h a partir da entrada” (não idle). `proxy.ts` só confere presença/validade do cookie em `/admin/*` exceto `/admin/login`; a checagem forte (HMAC) também roda no layout do painel e em cada Server Action — proxy não importa Drizzle.

**Alternatives considered:**
- NextAuth credentials — dependência + superfície.
- Token na URL — constituição permite token opaco para áreas restritas, mas o pedido foi “login padrão”.
- Sessão no banco — desnecessário para um usuário.

**Rate limit:** 5 falhas / 15 min / IP, tabela `admin_login_attempts` (hash do IP, sem senha). In-memory (RSVP atual) não serve em serverless multi-instância.

## 3. Next 16: `proxy.ts`, não `middleware.ts`

**Decision:** Auth de borda em `proxy.ts` na raiz (`export function proxy` + `matcher: ['/admin', '/admin/:path*']`). Redirect para `/admin/login` se não houver cookie válido. Layout do painel repete a verificação e `redirect`.

**Rationale:** File convention `middleware` está deprecated no Next 16.2 deste repo (`node_modules/next/dist/docs/.../proxy.md`).

**Alternatives considered:** Só layout sem proxy — vaza HTML do painel numa race; proxy reduz o vazamento. `unauthorized()` experimental — não usar.

## 4. Imagens: Drive + proxy, seed estático

**Decision:**
- Seed: referências `source=static` para `/images/hero/01.jpg` (únicos, sem duplicar o 02) e `/imagensPresentes/{id}.jpeg` se o arquivo existir.
- Upload novo: Route Handler autenticado inicia sessão resumível Drive (já existe `createResumableUploadSession`); cliente faz PUT na URL de uso único; `complete` grava `drive_file_id` em `site_media`. Pasta: subpasta `site-content` dentro de `GOOGLE_DRIVE_FOLDER_ID` (ou o mesmo folder com prefixo de nome).
- Público: `GET /api/site-media/[id]` com UUID. Se static, redirect/serve arquivo local; se drive, server baixa com OAuth e faz stream. `Cache-Control: public, max-age=3600`. next/image aponta para essa URL same-origin.

**Rationale:** Body de Server Action na Hobby ~4.5MB — não dá para mandar a foto no action. Constituição V exige sessão resumível iniciada no servidor. Drive “anyone with link” é adivinhável e listável; UUID no nosso domínio não é.

**Mime/tamanho:** jpeg/png/webp, máximo 8MB (recusa acima; não redimensiona no Hobby).

**Alternatives considered:**
- Multipart no Server Action — estoura limite Hobby.
- Vercel Blob — serviço novo (I).
- Bytea no Neon — estoura 0.5GB rápido.

## 5. Publicação e cache

**Decision:** Homepage `revalidate = 60` como rede de segurança. Toda mutação admin chama `revalidatePath('/')` (e `/api/presentes/[id]` quando Pix muda). Leitura pública em Server Component via `lib/content/public.ts`.

**Rationale:** SC-002 pede ≤ 1 minuto; `revalidatePath` em Server Action atualiza na hora.

**Fallback (VI/FR-020):** Se `DATABASE_URL` ausente ou query falhar, ler JSON/`public` atuais. Admin sem banco = erro honesto, sem seed parcial.

## 6. Seed idempotente

**Decision:** Tabela `content_seed` com uma linha. Primeira leitura com banco vazio (ou boot do painel) copia presentes.json, hero, sobre-nos, e os textos hoje hardcoded (Grande Dia, Traje, intro presentes, mensagem da home). Nunca roda de novo no deploy. Republicar não restaura exemplos.

**Rationale:** Clarificação B. Hero atual tem `02.jpg` duplicado no carrossel — seed só 01, 02, 03.

## 7. Pix e presentes públicos

**Decision:** Lista pública continua sem Pix no HTML da grade (como hoje: `chavePix` omitido no map). `GET /api/presentes/[id]` lê `gifts.pix` no banco. Validação ao salvar: 8–77 caracteres depois do trim, ou vazio.

**Rationale:** FR-008. Substitui `fs.readFileSync` em `app/api/presentes/[id]/route.ts`. GiftCard hoje ignora `presente.imagem` e usa `/imagensPresentes/${id}.jpeg` — o plano corrige para a URL gerida.

## 8. Validação sem Zod

**Decision:** Validadores em `lib/content/validation.ts` (tamanho, mime, limites 8/12, parágrafos ≥ 1). Sem adicionar Zod/Yup.

**Rationale:** IX pede justificativa para dependência nova; o volume de campos é pequeno. Forms nativos + Server Actions (`useActionState`).

## 9. UI do painel

**Decision:** shadcn já no repo (Button, Input, Label, Dialog, Sonner). Três áreas + login. Confirm dialog para delete de presente/foto. Parágrafos: botões adicionar/remover no bloco (não para mensagem da entrada / intro presentes / título / subtítulo / assinatura). Sem dnd-kit: setas cima/baixo para ordem (menos JS, funciona em 360px).

**Rationale:** Constituição pede shadcn antes de inventar. Sem lib de forms. Drag-and-drop extra quebraria mobile.

## 10. robots / descoberta

**Decision:** `app/robots.ts` Disallow `/admin`. Layout admin `robots: { index: false }`. Sem link no Navbar/Footer.

**Rationale:** Assunção da spec. Login ainda existe se alguém achar a URL — FR-001/003.
