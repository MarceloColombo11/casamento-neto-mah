# Site de Casamento — Neto & Mariah

Esqueleto do site para o casamento de Neto e Mariah. Data: **, às 16:00** (horário placeholder).

Baseado na arquitetura do site Suelen & Marcelo (mesmas seções, RSVP e upload de fotos via Google Drive).

## Tecnologias

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Shadcn/ui**
- **Google Maps Embed** (mapa, sem API key)
- **Google Apps Script** (RSVP)
- **Google Drive API** (upload resumível de fotos e vídeos dos convidados)

## Como rodar

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Configuração

1. Copie `.env.local.example` para `.env.local`
2. Preencha as variáveis:

| Variável                      | Descrição                                                    |
| ----------------------------- | ------------------------------------------------------------ |
| `GOOGLE_APPS_SCRIPT_RSVP_URL` | URL da Web App de confirmação (somente servidor)             |
| `GOOGLE_OAUTH_CLIENT_ID`      | OAuth Desktop client (upload Drive)                          |
| `GOOGLE_OAUTH_CLIENT_SECRET`  | Secret do OAuth client                                       |
| `GOOGLE_OAUTH_REFRESH_TOKEN`  | Refresh token da conta dona da pasta (`npm run drive:oauth`) |
| `GOOGLE_DRIVE_FOLDER_ID`      | ID da pasta do Drive onde as mídias serão salvas             |
| `NEXT_PUBLIC_SITE_URL`        | (Opcional) URL pública do site — ajuda no CORS do upload     |
| `NEXT_PUBLIC_WEDDING_DATE`    | Data e hora (ex: 2027-03-13T16:00:00)                        |
| `DATABASE_URL`                | Neon Postgres pooled (Marketplace da Vercel, sem `NEXT_PUBLIC_`) |
| `ADMIN_USERNAME`              | Identificador compartilhado do casal                         |
| `ADMIN_PASSWORD_HASH`         | Hash scrypt (`node scripts/hash-admin-password.mjs`)         |
| `ADMIN_SESSION_SECRET`        | Segredo da sessão (≥ 32 caracteres aleatórios)               |

## Upload de mídias (Google Drive)

Convidados enviam **várias fotos e vídeos** (até **200 MB** cada). O arquivo vai **direto do celular ao Drive**; a Vercel só abre a sessão de upload.

> **Importante:** Service Account **não grava** em Drive pessoal (erro `storageQuotaExceeded`). Use **OAuth** da conta Google que é dona da pasta.

### Setup OAuth (recomendado)

1. No [Google Cloud Console](https://console.cloud.google.com/), ative a **Google Drive API**.
2. **Credentials → Create credentials → OAuth client ID → Desktop app**.
3. Copie Client ID e Client Secret para o `.env.local`.
4. Defina `GOOGLE_DRIVE_FOLDER_ID` (ID na URL da pasta).
5. Rode uma vez (com a conta dona da pasta logada no navegador):

```bash
npm run drive:oauth
```

6. Cole o `GOOGLE_OAUTH_REFRESH_TOKEN` impresso no `.env.local` e na Vercel.
7. Reinicie `npm run dev`.

## RSVP (Google Apps Script)

Na pasta `scripts/` está o código de **RSVP** (confirmações em planilha). Veja os comentários no arquivo para implantação.

## Personalização

- **Fotos**: geridas em `/admin` (capa e Nossa História). Sem banco, o site usa `public/images/`.
- **Presentes**: geridos em `/admin`. Sem banco, o site usa `data/presentes.json`.
- **Textos da home, Grande Dia, Traje e Nossa História**: geridos em `/admin`.
- **Local**: atualize `data/venue.json` e o embed em `components/MapWidget.tsx`
- **Padrinhos/Damas**: edite `data/padrinhos.json`, `data/damas.json`, `data/convidados-honra.json`
- **Programação**: edite `data/programacao.json`
- **Monograma**: troque os SVGs em `public/` e ajuste `components/monograma.tsx`

## Deploy na Vercel

```bash
npm run build
```

Configure no painel da Vercel (**Project Settings > Environment Variables**):

- `GOOGLE_APPS_SCRIPT_RSVP_URL`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_ID`
- `NEXT_PUBLIC_WEDDING_DATE`
- (recomendado) `NEXT_PUBLIC_SITE_URL`
- `DATABASE_URL` (Neon Free no Marketplace; cada preview usa a branch de preview)
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`

O `.env.local` é apenas para desenvolvimento local.

## Painel dos noivos

A área `/admin/login` **não** aparece no menu. O casal recebe o endereço por mensagem privada.

1. Crie o hash da senha: `node scripts/hash-admin-password.mjs`
2. Preencha `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` e `DATABASE_URL`
3. Aplique o schema uma vez: `npm run db:migrate`
4. Abra `http://localhost:3000/admin/login`

O primeiro acesso com banco configurado copia o conteúdo atual do site (presentes de exemplo, fotos da capa e textos). Depois disso, o casal edita pelo painel. Sem banco, o site público continua no fallback dos JSON/`public`; salvar no painel mostra erro.

Fotos novas do painel usam o mesmo Google Drive do álbum de convidados (até 8 MB, JPEG/PNG/WebP).
