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

- **Fotos**: adicione imagens em `public/images/` e atualize os JSONs em `data/`
- **Presentes**: edite `data/presentes.json` (inclua a chave Pix real)
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

O `.env.local` é apenas para desenvolvimento local.
