# Design — Tabela de convidados no painel

**Data:** 2026-09-17  
**Status:** Aprovado  
**Superfície:** `/admin/convidados` (só o painel; RSVP público não muda)

## Objetivo

Os noivos veem a lista numa tabela prática, reconhecem o status por tags pastel e incluem pessoas sem abrir diálogo: nome + grupo na primeira linha, Enter salva.

## Decisões

| Tema | Decisão |
|------|---------|
| Inclusão | Linha permanente no topo da tabela (nome, grupo opcional, Enter). Sem diálogo para criar. |
| Vista | Uma tabela só, coluna Grupo com select em cada linha |
| Filtro | Busca por nome + filtro “Todos os grupos” / um grupo |
| Status na lista | Tags curtas: **Confirmou**, **Pendente**, **Não vai** |
| Cores | Pastel, texto escuro: verde / amarelo / vermelho |
| Celular (360px) | Mesma tabela; a linha quebra em duas se precisar; tag continua visível |
| Avulsas | Tabela menor embaixo, mesmas tags (Vou verde / Não vai vermelho) |
| Editar / remover / novo grupo | Continuam em diálogo com confirmação na remoção |
| Banco e API | Sem mudança de schema, actions ou RSVP público |

## Experiência

### Barra

- Busca local (como hoje).
- Select de grupo: “Todos os grupos” ou um rótulo existente.
- Botão **Novo grupo** (diálogo atual).

Se o filtro for um grupo, a linha de inclusão já nasce com esse grupo selecionado. Depois de salvar, o nome limpa, o grupo permanece, o foco volta no nome.

### Tabela principal

Colunas: **Nome**, **Status**, **Grupo**, ações (Editar, Remover).

Primeira linha (inclusão): input nome, select grupo, Enter ou botão **Incluir**. Status da pessoa nova continua pendente.

Linhas existentes: nome, tag, select de grupo (salva na hora), Editar (diálogo de nome/grupo), Remover (diálogo).

Lista vazia: só a linha de inclusão e o texto “A lista ainda está vazia.”

Ordenação: nome A–Z. Filtro de grupo esconde linhas, não a inclusão.

### Tags

Pílulas compactas (`min-h-6`), sem sombra, texto escuro:

| Status | Rótulo | Fundo | Texto |
|--------|--------|-------|--------|
| confirmed | Confirmou | `#E4F0E2` | `#3D5C3A` |
| pending | Pendente | `#F7EFD0` | `#7A5C14` |
| declined | Não vai | `#F6E0E0` | `#7A3B3B` |

Avulsas: `attending === true` → Vou (verde da tabela); senão Não vai (vermelho).

Contadores do topo da página usam os mesmos três rótulos (Pendente no lugar de “ainda não responderam”).

### Fora de escopo

- Editar o nome clicando na célula
- Colar vários nomes
- Mudar status no painel (o RSVP público continua sendo a fonte)
- Cartões diferentes no mobile
- Mudança no modal do site

## Testes

- Incluir “Ana Souza” com Enter; aparece como Pendente (tag amarela); o campo nome esvazia.
- Filtrar um grupo: só aquele grupo na tabela; inclusão usa esse grupo.
- Confirmou / Não vai mostram tags verde / vermelha.
- 360px: nome, tag e ações usáveis (alvo ≥ 44px nos botões).
