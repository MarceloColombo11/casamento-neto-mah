<!--
Sync Impact Report
- Version change: (inexistente) → 1.0.0
- Ratification: initial adoption of the project constitution (2026-09-17)
- Modified principles: none (first version)
- Added principles:
  I. Custo Zero Inegociável
  II. Conteúdo Estático Primeiro, Banco por Exceção
  III. Server-First (RSC por padrão)
  IV. Integrações Externas Atrás de uma Fronteira
  V. Segredos Nunca no Cliente
  VI. Degradação Graciosa em Dados de Convidados
  VII. Mobile-First e Performance Real
  VIII. Privacidade dos Convidados (LGPD)
  IX. Simplicidade e Disciplina de Dependências
- Added sections: Stack e Restrições Tecnológicas; Fluxo de Trabalho e Qualidade; Governança
- Removed sections: none
- Dependent templates: plan-template.md, spec-template.md and tasks-template.md
  read this constitution at runtime; no manual template edits required.
- Follow-up TODOs: none.
- Factual alignments applied at ratification (no principle change):
  env example file is `.env.local.example` (repo convention);
  Spec Kit commands in this Cursor project use hyphen form
  (`/speckit-plan`, `/speckit-tasks`, `/speckit-analyze`).
-->

# Constituição do Site de Casamento

Projeto: site de casamento single-tenant, hospedado na Vercel, construído em Next.js 16 (App
Router) com React 19, TypeScript e Tailwind CSS 4. Público: os noivos (edição de conteúdo) e os
convidados (leitura, RSVP, envio de mídia). Documento vivo: toda decisão de spec, plano e
implementação é avaliada contra os princípios abaixo.

## Princípios Fundamentais

### I. Custo Zero Inegociável

Todo serviço, integração ou dependência de infraestrutura DEVE operar dentro de um plano
gratuito permanente. É PROIBIDO introduzir qualquer recurso que exija cartão de crédito
cadastrado para funcionar, que cobre por excedente automaticamente, ou cujo free tier seja um
trial com prazo de expiração.

Antes de aprovar um serviço novo, a spec DEVE registrar: limites do free tier, o que acontece
ao estourá-los (bloqueio, throttle ou cobrança), e a estimativa de uso no pico esperado — o pico
real deste projeto é a semana do casamento, não a média mensal.

Qualquer recurso que possa gerar cobrança DEVE ter spending limit configurado em zero no
provedor. Se o provedor não oferece esse controle, o recurso é rejeitado.

*Justificativa:* o projeto é um favor para um amigo. Uma fatura surpresa é uma falha de produto,
não um detalhe operacional.

### II. Conteúdo Estático Primeiro, Banco por Exceção

Conteúdo editorial — história do casal, cronograma, informações de local, FAQ, lista de
presentes, textos e legendas — DEVE viver como JSON tipado em `data/` e ser servido via
renderização estática. Não se usa banco de dados para conteúdo que muda por commit.

O banco de dados é reservado para estado que nasce em tempo de execução e precisa de leitura
consistente: confirmações de presença, mensagens do mural de recados, controle de idempotência
e auditoria de uploads. Toda feature que propuser persistir algo no banco DEVE justificar na
spec por que JSON estático ou a planilha não atendem.

Cada arquivo em `data/` DEVE ter um tipo TypeScript correspondente, e a leitura DEVE validar o
formato em tempo de build — um JSON malformado precisa quebrar o build, nunca a página.

*Justificativa:* páginas estáticas são infinitamente mais baratas, mais rápidas e mais confiáveis
que consultas. O banco entra para resolver o que estático não resolve, e só isso.

### III. Server-First (RSC por Padrão)

Componentes são React Server Components por padrão. `"use client"` DEVE ser adicionado apenas
no menor componente que realmente precisa de interatividade, estado de navegador ou API do DOM.

Busca de dados acontece no servidor. Nenhum componente de cliente DEVE fazer `fetch` direto para
API do Google ou para o banco. Mutações passam por Server Actions ou Route Handlers em
`app/api/`, nunca por chamadas diretas do navegador a terceiros.

Bibliotecas pesadas e apenas visuais (Embla Carousel, canvas-confetti, qrcode.react) DEVEM ser
carregadas dinamicamente e ficar fora do bundle inicial das rotas que não as usam.

*Justificativa:* metade dos convidados vai abrir o site em celular antigo, no 4G, em pé numa fila.
Cada kilobyte de JavaScript que não precisa existir é um convidado a menos que confirma presença.

### IV. Integrações Externas Atrás de uma Fronteira

Toda integração com terceiros — Google Sheets/Apps Script, Google Drive, Google Maps, banco —
DEVE ser acessada exclusivamente por um módulo de serviço dedicado em `lib/` que exponha uma
interface de domínio (`createRsvp`, `listGiftItems`, `uploadGuestMedia`), não a API do provedor.

Código de rota, de página ou de componente é PROIBIDO de importar SDK de provedor, montar URL de
API externa ou conhecer formato de resposta de terceiro.

Cada módulo de integração DEVE definir seu próprio tipo de erro de domínio e nunca vazar erro
bruto do provedor para a UI.

*Justificativa:* free tiers mudam de dono e de regra. Quando o Apps Script der problema na véspera
do casamento, a troca precisa ser um arquivo, não uma caçada pelo repositório inteiro.

### V. Segredos Nunca no Cliente

Credenciais, refresh tokens do OAuth, IDs de planilha, IDs de pasta do Drive, chaves de deploy e
a connection string do banco DEVEM existir apenas como variáveis de ambiente de servidor.
É PROIBIDO prefixar qualquer segredo com `NEXT_PUBLIC_`.

Todo Route Handler ou Server Action que escreve dados DEVE validar a entrada com um schema antes
de qualquer efeito colateral, e DEVE ter proteção contra abuso — no mínimo rate limiting por IP e
verificação de origem. Endpoints públicos de escrita sem validação são bloqueadores de merge.

O token de acesso do Google DEVE ser renovado no servidor. O upload resumível para o Drive DEVE
ser iniciado pelo servidor; a URL de sessão entregue ao cliente é de uso único e escopo limitado
àquele upload.

`.env.local.example` DEVE listar toda variável exigida, com descrição e sem valores reais.

*Justificativa:* uma credencial de Drive vazada num bundle público significa que qualquer pessoa
escreve na conta do Google dos noivos.

### VI. Degradação Graciosa em Dados de Convidados

Perder uma confirmação de presença é a pior falha possível deste sistema. Nenhum RSVP DEVE ser
perdido por indisponibilidade de terceiro.

A escrita de RSVP DEVE persistir primeiro no banco, de forma transacional, e só então propagar
para a planilha do Google. Se a propagação falhar, a operação DEVE retornar sucesso ao convidado,
registrar a falha e ficar elegível para retentativa — nunca descartar o dado nem exibir erro a
quem já confirmou.

Toda escrita em terceiro DEVE ser idempotente, com chave estável por convidado, de modo que
retentativas não dupliquem linhas.

Toda leitura de terceiro DEVE ter timeout explícito e um estado de fallback renderizável. Falha
no Maps, no Drive ou na planilha degrada aquela seção; não derruba a página.

*Justificativa:* a planilha é o painel de controle dos noivos, mas não pode ser o único lugar onde
o dado existe.

### VII. Mobile-First e Performance Real

O layout é desenhado a partir de 360px de largura. Toda feature DEVE ser verificada em viewport
de celular antes de merge.

Orçamento por rota: LCP abaixo de 2.5s e CLS abaixo de 0.1 em 4G simulado com throttling de CPU
4x. Imagens DEVEM usar `next/image` com dimensões explícitas e formatos modernos. Fontes DEVEM ser
carregadas via `next/font` com `display: swap`, sem FOUT visível.

O mapa DEVE usar Google Maps Embed sem chave de API e ficar atrás de carregamento sob demanda,
nunca bloqueando a renderização inicial.

Interações DEVEM ser acessíveis por teclado, com foco visível, HTML semântico e contraste
mínimo AA. `canvas-confetti` e animações decorativas DEVEM respeitar `prefers-reduced-motion`.

*Justificativa:* o site será aberto majoritariamente por link de WhatsApp, em celular, com
conexão ruim, por pessoas de todas as idades.

### VIII. Privacidade dos Convidados (LGPD)

O site coleta dados pessoais de terceiros. Cada campo de formulário DEVE ter finalidade declarada
na spec; campo sem finalidade não é implementado.

É PROIBIDO enviar dados de convidados para qualquer analytics, pixel, serviço de terceiro ou log
que não esteja explicitamente aprovado nesta constituição. Logs de aplicação DEVEM omitir nome,
telefone, e-mail e mensagem — registram apenas identificador opaco e resultado da operação.

Fotos e vídeos enviados por convidados DEVEM ir para pasta do Drive com escopo restrito, sem
listagem pública e sem URL adivinhável. Links compartilháveis, quando existirem, DEVEM ser
revogáveis.

A página do site DEVE informar, em linguagem simples, quais dados são coletados e para quê.

*Justificativa:* os dados são dos convidados, emprestados para uma festa. O tratamento reflete isso.

### IX. Simplicidade e Disciplina de Dependências

O projeto usa o menor número de peças possível. Adicionar dependência de produção exige
justificativa na spec: o que ela resolve, por que a plataforma ou o código próprio não resolvem,
tamanho no bundle e estado de manutenção.

É PROIBIDO introduzir ORM pesado, camada de autenticação de usuário final, CMS externo, gerenciador
de estado global, biblioteca de formulários ou runtime de backend adicional sem emenda a esta
constituição.

Não há login de convidado. O acesso a áreas restritas, se necessário, se dá por link com token
opaco. Autenticação real existe apenas para os noivos, se e quando uma área administrativa for
especificada.

Abstração é escrita quando o terceiro caso aparece, não antes.

*Justificativa:* este projeto tem um mantenedor, uma data de entrega imóvel e nenhum orçamento.
Complexidade é o risco dominante.

## Stack e Restrições Tecnológicas

A stack abaixo é fixa. Alterá-la exige emenda constitucional.

**Frontend**
- Next.js 16.2 (App Router) + React 19.2
- TypeScript em modo `strict`; `any` explícito é bloqueador de merge
- Tailwind CSS 4 via PostCSS; CSS arbitrário fora do design system requer justificativa
- shadcn/ui (estilo `base-nova`, RSC) sobre Base UI — componentes de UI DEVEM ser derivados daqui
  antes de serem escritos do zero
- Lucide para ícones; Sonner para notificações
- Embla Carousel, canvas-confetti, qrcode.react — todos com carregamento dinâmico

**Backend**
- Route Handlers do App Router em `app/api/` e Server Actions; nenhum outro runtime de servidor
- Conteúdo editorial em JSON tipado em `data/`
- RSVP e mural de recados: banco como fonte primária, Google Apps Script/Sheets como espelho
  para os noivos
- Upload de mídia: Google Drive API com OAuth e upload resumível, sessão iniciada no servidor
- Mapa: Google Maps Embed, sem chave de API

**Banco de dados (aprovado)**
- Neon Postgres, provisionado pelo Vercel Marketplace, permanecendo no free tier
- Acesso via `@neondatabase/serverless` com connection string pooled; Drizzle ORM é permitido
  como camada de schema e migrations
- Prisma, Postgres self-hosted, Firebase e Supabase permanecem PROIBIDOS
- Migrations DEVEM ser versionadas em arquivo, aplicadas por comando explícito, nunca por
  sincronização automática de schema em deploy
- Branches de preview DEVEM usar branch de banco separada; dados de produção nunca são usados
  em preview
- Consultas DEVEM ser parametrizadas; concatenação de SQL é bloqueador de merge

**Tooling e deploy**
- npm como gerenciador de pacotes; `package-lock.json` versionado
- ESLint 9 com `eslint-config-next`; build com aviso de lint não é mergeável
- Deploy na Vercel, plano Hobby, com spending limit em zero
- `main` é a branch de produção; toda feature passa por preview deployment antes do merge

## Fluxo de Trabalho e Qualidade

Toda mudança segue o ciclo Spec Kit: spec, plano, tarefas, implementação, análise. Features
puramente cosméticas ou de uma linha podem pular a spec formal, mas continuam sujeitas a todos os
princípios acima.

Todo plano DEVE preencher a seção Constitution Check declarando, por princípio, conformidade ou
violação justificada. Violação sem justificativa registrada bloqueia a implementação.

Portões obrigatórios antes de merge:
1. `npm run lint` e `npm run build` passam sem erro e sem aviso novo
2. TypeScript compila em modo strict
3. Nenhum segredo novo exposto ao cliente; `.env.local.example` atualizado
4. Nenhum serviço pago introduzido; free tier documentado na spec
5. Rota nova verificada em viewport de 360px
6. Caminho de escrita de dados de convidado testado com o terceiro indisponível

Antes do congelamento da véspera do casamento, o fluxo de RSVP, o upload de mídia e a página de
informações do local DEVEM passar por verificação manual em dispositivo real. A partir do
congelamento, só correções críticas são mergeadas.

## Governança

Esta constituição tem precedência sobre qualquer outra prática, template ou preferência do
projeto. Em conflito entre esta constituição e uma spec, a constituição vence e a spec é corrigida.

Emendas exigem: proposta escrita com justificativa, avaliação de impacto nas specs ativas, e
atualização do bloco Sync Impact Report no topo deste arquivo.

Versionamento semântico das emendas:
- MAJOR: remoção ou redefinição incompatível de princípio ou governança
- MINOR: novo princípio, nova seção, ou expansão material de regra existente
- PATCH: esclarecimento, redação, correção que não altera obrigação

Os comandos `/speckit-plan`, `/speckit-tasks` e `/speckit-analyze` leem este arquivo em tempo de
execução. `/speckit-analyze` é o verificador de desvio: violações de princípio são reportadas como
CRITICAL e devem ser resolvidas antes da implementação prosseguir.

Exceções a um princípio são permitidas quando registradas explicitamente no plano da feature, com
o motivo e o custo aceito. Exceção não registrada é violação.

**Version**: 1.0.0 | **Ratified**: 2026-09-17 | **Last Amended**: 2026-09-17
