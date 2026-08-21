# Design — Esqueleto site Neto & Mariah

## Objetivo

Criar o site de casamento de **Neto & Mariah** como cópia funcional do projeto `casamento` (Suelen & Marcelo), com a mesma arquitetura e seções, conteúdo em placeholder e integrações (Drive/RSVP) prontas para configurar depois.

## Decisões

| Item           | Valor                             |
| -------------- | --------------------------------- |
| Abordagem      | Cópia rsync + sanitização         |
| Casal          | Neto & Mariah                     |
| Data           |                                   |
| Horário        | 16:00 (placeholder)               |
| Repo GitHub    | `casamento-neto-mah` (privado)    |
| Vercel / Drive | Configuração posterior pelo autor |

## Escopo incluído

- Home completa: hero, sobre, padrinhos, damas, honra, local, RSVP, programação, presentes, upload de fotos
- APIs: `/api/rsvp`, `/api/upload/*`, `/api/upload-photo/*`, `/api/presentes/[id]`
- Scripts OAuth Drive e Apps Script RSVP
- Tema visual herdado (cores/folhas) até customização futura

## Escopo excluído / sanitizado

- Fotos e textos pessoais do casamento anterior
- Chaves Pix e segredos (`.env.local`)
- `node_modules`, `.next`, histórico git do outro projeto

## Placeholders

- JSONs em `data/` com estrutura mínima e textos genéricos
- Imagem hero/share suaves em `public/images/`
- Env example com `NEXT_PUBLIC_WEDDING_DATE=2027-03-13T16:00:00`
- Local/mapa/Instagram genéricos até definição do venue

## Deploy

1. `npm install && npm run build`
2. GitHub privado + push
3. Vercel: conectar repo e preencher env vars (RSVP + Drive)
