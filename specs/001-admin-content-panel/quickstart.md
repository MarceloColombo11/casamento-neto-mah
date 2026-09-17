# Quickstart: Painel admin dos noivos

Validação ponta a ponta da spec. Sem código de implementação neste arquivo.

## Pré-requisitos

- Node + npm deste repo
- Conta Vercel Hobby com spending limit 0
- Neon Free pelo Marketplace da Vercel (produção) e branch de preview automática
- Google Drive OAuth já usado no álbum (`GOOGLE_OAUTH_*`, `GOOGLE_DRIVE_FOLDER_ID`)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (scrypt), `ADMIN_SESSION_SECRET` (≥ 32 bytes aleatórios)
- `DATABASE_URL` pooled (sem `NEXT_PUBLIC_`)

Gerar hash (depois que o script existir):

```bash
node scripts/hash-admin-password.mjs
```

Copiar variáveis em `.env.local` a partir de `.env.local.example` atualizado. Na Vercel, as mesmas keys; preview usa `DATABASE_URL` da branch Neon, nunca a de produção.

## Setup local

```bash
npm install
npx drizzle-kit migrate
npm run dev
```

Abrir `http://localhost:3000/admin/login` (não aparece no menu).

## Cenários de validação

1. **Sem sessão:** `/admin` e `/admin/presentes` caem no login. Home pública continua igual (seed ainda não rodou **ou** já seedou os exemplos — conferir spec B).
2. **Login errado:** mensagem genérica. 6ª tentativa em 15 min continua recusada.
3. **Login certo:** painel com Presentes, Fotos, Textos em < 10s. Viewport 360px: áreas tocáveis.
4. **Presente:** criar com título, descrição, Pix, imagem (jpeg < 4MB). Abrir janela anônima na home → item visível; abrir o card → Pix copia. Editar; reordenar com setas; remover com dialog — some de vez.
5. **Fotos:** capa recusa a 9ª; história a 13ª. Remover todas as da capa → home não quebra (fundo simples).
6. **Textos:** adicionar parágrafo em Traje; recusar salvar Nossa História sem parágrafos; home mostra o texto novo.
7. **Sessão 8h:** não precisa esperar — inspecionar cookie `Max-Age=28800` e um teste unitário/manual de `exp` no passado → redirect login.
8. **Banco down:** parar Neon / `DATABASE_URL` inválida. Home ainda abre (fallback). Salvar no admin mostra erro, não apaga o que o público via.
9. **Lint/build:** `npm run lint` e `npm run build` limpos.

## Contratos e modelo

- Auth: [contracts/admin-auth.md](./contracts/admin-auth.md)
- CRUD: [contracts/content.md](./contracts/content.md)
- Mídia: [contracts/site-media.md](./contracts/site-media.md)
- Tabelas: [data-model.md](./data-model.md)

## Produção

1. Marketplace Neon + env na Vercel
2. `drizzle-kit migrate` contra produção (comando explícito, uma vez)
3. Primeiro hit com `DATABASE_URL` dispara seed v1
4. Enviar `/admin/login` aos noivos por mensagem privada
5. Preview: conferir que a lista de presentes de preview **não** é a de produção
