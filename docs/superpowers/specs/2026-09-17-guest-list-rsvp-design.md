# Design — Lista de convidados e confirmação de presença

**Data:** 2026-09-17  
**Status:** Aprovado  
**Superfície:** painel `/admin/convidados` + modal público de RSVP

## Objetivo

Os noivos cadastram cada convidado no painel, veem quem confirmou ou avisou que não vai, e organizam a vista em casais/famílias. No site, o convidado digita o nome, as sugestões da lista preenchem sozinhas, e escolhe se vai ou não vai. Se o nome não estiver na lista, a confirmação entra do mesmo jeito e cai numa fila à parte para os noivos vincularem, criarem o cadastro ou descartarem.

## Decisões já fechadas

| Tema | Decisão |
|------|---------|
| Unidade da lista | Uma pessoa por linha |
| Agrupamento | Casal/família só para organizar a visualização no painel |
| Quem confirma | Só a própria pessoa, um nome por envio |
| Status | Três estados: ainda não respondeu, confirmou, não vai |
| Formulário público | Só nome (com preenchimento automático) e se vai / não vai |
| Fora do formulário público | E-mail, acompanhante e microônibus desta versão |
| Nomes que não batem | Aceitar e separar em confirmações avulsas |
| Persistência | Neon (já no projeto). Planilha Google deixa de ser a fonte da verdade |

## Escopo incluído

- CRUD de convidados no painel autenticado (mesmo login de presentes/fotos/textos)
- Grupos opcionais (rótulo tipo “Família Colombo”) para agrupar a lista
- Contadores: confirmou / não vai / ainda não respondeu
- Modal público: typeahead no nome + vou / não vou
- Fila de confirmações avulsas: vincular, criar convidado, descartar
- RSVP grava no Neon **antes** de qualquer tentativa de espelho externo

## Escopo excluído

- Login de convidado
- E-mail, telefone, mesa, traje, restrição alimentar
- Confirmar o grupo inteiro de uma vez
- Importar planilha nesta versão (cadastro manual no painel)
- Painel de RSVP no Google Sheets como fonte (espelho, se existir, é best-effort e fora do caminho crítico)
- Mensagens individuais, QR de convite, lista de presença na porta

## Histórias

### P1 — Lista dos noivos

Os noivos abrem **Convidados**, cadastram nomes (um por pessoa), editam, removem com confirmação, e veem o status de cada um.

**Teste independente:** autenticado, criar “Marcelo Henrique Colombo”, ver pendente, editar o nome, remover com dialog.

### P2 — Confirmação pública com preenchimento automático

O convidado abre Confirmar presença, começa a digitar, vê sugestões da lista, escolhe o nome, marca se vai ou não vai, envia. O painel atualiza o status daquela pessoa.

**Teste independente:** cadastrar um nome no painel; no site (janela anônima) digitar as primeiras letras, escolher, marcar “vou”, enviar; no painel o status vira confirmou.

### P3 — Confirmações avulsas

O convidado envia um nome que **não** está na lista. O site agradece igual. No painel, o item aparece só em **Confirmações avulsas**, não na lista principal, até os noivos vincularem a alguém, criarem o convidado, ou descartarem.

**Teste independente:** lista tem “Marcelo Henrique Colombo”; o site envia “Marcelo Colombo” + vou; a lista principal continua pendente; a avulsa mostra o texto digitado; vincular atualiza o cadastro certo e some da fila.

### P4 — Grupos na visualização

Os noivos criam um grupo (casal/família), colocam pessoas nele, e a lista do painel aparece agrupada. Quem está sem grupo fica numa seção “Sem grupo”. O RSVP público continua sendo um nome por vez.

**Teste independente:** criar grupo “Família Colombo”, associar duas pessoas, ver as duas sob o mesmo título.

## Experiência

### Painel `/admin/convidados`

Mesma cromia e chrome do painel (Início, Presentes, Fotos, Textos, **Convidados**). Utilizável em 360px.

Duas áreas na mesma página (abas ou seções):

1. **Lista** — busca local, totais no topo, lista agrupada. Cada pessoa: nome, status, ações editar/remover, seletor de grupo. Botão para adicionar pessoa e para criar grupo.
2. **Confirmações avulsas** — só itens não resolvidos. Cada card: nome digitado, se vai/não vai, data. Ações: Vincular (escolhe da lista), Criar convidado, Descartar (com confirmação).

Status visível em português: “Ainda não respondeu”, “Confirmou”, “Não vai”.

Remoção de convidado pede confirmação e é definitiva (mesmo padrão de presentes). Se o convidado já tinha respondido, o dado de RSVP some com ele.

### Site público

O modal atual (`RsvpModal`) passa a ter:

- Campo nome com lista de sugestões enquanto digita (mínimo 2 caracteres)
- Duas opções claras: **Vou** / **Não vou** (obrigatório)
- Enviar

Sem e-mail, acompanhante ou microônibus.

Se escolher uma sugestão, o envio atualiza aquele convidado. Se enviar texto livre sem match, cria avulsa. O convidado sempre vê sucesso (não “nome não encontrado”).

Se a pessoa **já** tinha respondido e envia de novo (mesmo convidado da lista), o status **substitui** o anterior (pode mudar de “vou” para “não vou”).

Confirmação avulsa com o mesmo texto normalizado já na fila: atualiza o “vou/não vou” em vez de duplicar.

## Dados (Neon)

### `guest_groups`

| Campo | Tipo | Regras |
|-------|------|--------|
| id | uuid PK | |
| label | text | 1…80, trim, obrigatório |
| sort_order | int | para ordem da vista |
| created_at | timestamptz | |

### `guests`

| Campo | Tipo | Regras |
|-------|------|--------|
| id | uuid PK | |
| full_name | text | 1…120, trim, pelo menos duas palavras |
| name_normalized | text | minúsculo, sem acento, espaços colapsados; usado na busca |
| group_id | uuid null FK | on delete set null |
| status | enum | `pending` \| `confirmed` \| `declined` |
| responded_at | timestamptz null | preenchido quando deixa de ser pending |
| created_at / updated_at | timestamptz | |

Não há unique em `full_name` (homônimos existem). O typeahead mostra os dois; o casal distingue pelo grupo.

### `unmatched_rsvps`

| Campo | Tipo | Regras |
|-------|------|--------|
| id | uuid PK | |
| typed_name | text | como o convidado enviou, trim |
| name_normalized | text | mesma normalização da lista |
| attending | boolean | true = vou, false = não vou |
| created_at / updated_at | timestamptz | |

Resolução (vincular / criar / descartar) **apaga** a row avulsa. Não há lixeira.

## Contratos

Todas as escritas do painel: sessão `admin_session`. Erros em português, sem nome nos logs (constituição VIII: log só resultado opaco).

### Painel (Server Actions)

- listar convidados + grupos + avulsas
- criar/editar/remover convidado
- criar/renomear/remover grupo (remover grupo não apaga pessoas; elas ficam sem grupo)
- atribuir grupo a uma pessoa
- vincular avulsa → `guest_id` (copia attending para confirmed/declined, some a avulsa)
- criar convidado a partir da avulsa (nome = typed_name, status conforme attending)
- descartar avulsa

### Público

`GET /api/rsvp/suggest?q=`

- Sem autenticação, Origin checado, rate limit
- `q` com 2+ caracteres depois da normalização
- Resposta: até 8 `{ id, fullName }` que contenham o trecho
- Sem status, sem grupo, sem lista completa

`POST /api/rsvp`

- Body: `{ name, attending: boolean, guestId?: uuid }`
- Origin + rate limit
- Nome: trim, duas palavras
- Se `guestId` válido e o nome normalizado bate com esse convidado (ou o id foi escolhido na sugestão): atualiza status
- Senão: upsert na fila avulsa por `name_normalized`
- Sempre 200 de sucesso para o convidado se a escrita no Neon ok
- Se `GOOGLE_APPS_SCRIPT_RSVP_URL` existir: POST best-effort **depois** do commit; falha só no log, sem erro na tela

## Privacidade

Finalidade do nome: identificar quem vem à festa e mostrar no painel do casal. Finalidade de vou/não vou: organização da lista.

A busca pública **não** devolve a lista inteira. Exige 2 caracteres, limita 8, não inclui status. Rate limit por IP (mesmo espírito do RSVP atual).

Logs não gravam o nome digitado.

## Erros e bordas

- Banco indisponível no envio público: mensagem genérica “Tente de novo em instantes”; não fingir sucesso
- Sugestão vazia: o convidado ainda pode enviar; vira avulsa
- Homônimo: duas sugestões iguais; o casal organiza por grupo
- Descartar avulsa: some só da fila; não cria convidado
- Vincular avulsa “vou” a alguém que já estava “não vai”: o status passa a confirmou
- Convidado removido: some da lista e das sugestões

## Critérios de sucesso

- Casal cadastra 10 nomes no celular em poucos minutos e vê totais certos
- Convidado com nome na lista confirma em um fluxo (digitar → escolher → vou → enviar)
- “Marcelo Colombo” vs “Marcelo Henrique Colombo” não marca o cadastro errado sozinho; cai em avulsas
- Nenhuma confirmação pública some se o Google estiver fora do ar
- Painel 360px: cadastrar, ver status, resolver avulsa

## Integração com o que já existe

- Reusa cookie e `proxy.ts` do admin; nova rota no chrome
- Substitui o POST atual que só fala com Apps Script
- Paleta e componentes admin iguais aos de presentes
- Constituição I (custo zero / Neon), VI (banco primeiro), VIII (LGPD), IX (sem lib de form / sem NextAuth)
