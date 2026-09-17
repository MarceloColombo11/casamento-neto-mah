# Tabela de convidados no painel — Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Commits só se o usuário pedir.

**Goal:** No painel, a lista vira uma tabela com tags pastel e uma linha de inclusão no topo.

**Architecture:** Função pura de rótulo/cor em `lib/content/guest-status.ts`. `GuestPanel` troca os cartões por `<table>`. Sem mudança de schema, actions ou RSVP público.

**Tech Stack:** Next.js App Router, React 19, Tailwind, `node:test`. Sem lib de tabela ou forms.

## Global Constraints

- Português na UI. 360px. Alvos `min-h-11` nos controles.
- Tags pastel com texto escuro (hex da spec).
- Logs sem nomes.
- Sem commit automático.

## File map

| File | Responsibility |
|------|----------------|
| `lib/content/guest-status.ts` | rótulo + classes da tag |
| `lib/content/guest-status.test.ts` | testes |
| `package.json` | inclui o teste no `test:guests` |
| `components/admin/GuestPanel.tsx` | tabela, inclusão, filtro de grupo |
| `app/admin/(panel)/convidados/page.tsx` | contadores com “pendentes” |

---

### Task 1: Tags puras + testes

**Files:** create `lib/content/guest-status.ts`, `lib/content/guest-status.test.ts`; modify `package.json`

```ts
export function guestStatusTag(status: "pending" | "confirmed" | "declined"): {
  label: string;
  className: string;
}
export function unmatchedAttendanceTag(attending: boolean): {
  label: string;
  className: string;
}
```

Cores: Confirmou `#E4F0E2`/`#3D5C3A`; Pendente `#F7EFD0`/`#7A5C14`; Não vai `#F6E0E0`/`#7A3B3B`.

- [ ] Testes falhando → implementar → `npm run test:guests` passa

### Task 2: Tabela + inclusão + filtro

**Files:** `components/admin/GuestPanel.tsx`, `app/admin/(panel)/convidados/page.tsx`

- Barra: busca, select de grupo, Novo grupo
- Tabela: linha de inclusão (Enter / Incluir); linhas com tag, select de grupo, Editar, Remover
- Filtro de grupo aplica nas linhas; inclusão herda o grupo filtrado
- Após salvar: limpa nome, mantém grupo, foca o input
- Avulsas em tabela com as mesmas tags
- Sem diálogo de criar convidado
- 360px: `overflow-x-auto`; botões `min-h-11`

### Task 3: Verificar no browser

- Incluir com Enter, tag Pendente
- Filtrar grupo
- Conferir tags verde/amarela/vermelha
- Avulsas
- Viewport 360
