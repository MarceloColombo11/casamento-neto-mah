# Lista de convidados e RSVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Os noivos cadastram convidados no painel (com grupos só para a vista) e veem confirmou / não vai / pendente; no site o convidado digita o nome com sugestões, escolhe vou/não vou, e nomes que não batem caem em confirmações avulsas.

**Architecture:** Neon é a fonte. Funções puras de nome e de match ficam em `lib/content/`. O painel usa Server Actions + cookie `admin_session`. O público usa `GET /api/rsvp/suggest` e `POST /api/rsvp` (grava no banco primeiro; Apps Script só depois, best-effort). Sem lib de formulário, sem NextAuth.

**Tech Stack:** Next.js 16.2 App Router, React 19.2, Drizzle + Neon HTTP, shadcn/ui `base-nova`, TypeScript strict. Testes de lógica com `node:test` (`node --experimental-strip-types --test`). Sem Vitest.

**Spec:** `docs/superpowers/specs/2026-09-17-guest-list-rsvp-design.md`

## Global Constraints

- Respostas e erros de UI em português.
- Logs NÃO gravam nome, e-mail ou texto digitado — só tag opaca (`[rsvp]`, `[guests]`) e sucesso/falha.
- Sem Zod, NextAuth, lib de forms, CMS.
- Painel 360px; cromia igual a presentes (navy, gold, beige, cream).
- RSVP: persistir Neon **antes** de qualquer `GOOGLE_APPS_SCRIPT_RSVP_URL`.
- Sugestão pública: mínimo 2 caracteres normalizados, máximo 8 resultados, só `{ id, fullName }`.
- Remoção de convidado e descarte de avulsa pedem dialog de confirmação; são definitivos.
- Commits só se o usuário pedir nesta sessão; senão pule os passos “Commit”.

## File map

| File | Responsibility |
|------|----------------|
| `lib/content/guest-name.ts` | `normalizePersonName`, `validateGuestFullName` |
| `lib/content/rsvp-match.ts` | `resolveRsvpTarget` |
| `lib/content/guests.ts` | CRUD guests/groups/unmatched + apply public RSVP |
| `lib/db/schema.ts` | tabelas e enum |
| `drizzle/0002_*.sql` | migration |
| `app/actions/guests.ts` | Server Actions do painel |
| `app/admin/(panel)/convidados/page.tsx` | RSC da área |
| `components/admin/GuestPanel.tsx` | lista, grupos, avulsas |
| `app/api/rsvp/suggest/route.ts` | typeahead |
| `app/api/rsvp/route.ts` | POST vou/não vou |
| `lib/rsvp-rate-limit.ts` | rate limit extraído do POST atual |
| `lib/rsvp-sheet-mirror.ts` | espelho Google depois do commit |
| `components/RsvpModal.tsx` | UI pública |
| `components/admin/AdminChrome.tsx` | nav Convidados |
| `app/admin/(panel)/page.tsx` | card no início |
| `package.json` | script `test:guests` |

---

### Task 1: Normalização e validação de nome

**Files:**
- Create: `lib/content/guest-name.ts`
- Create: `lib/content/guest-name.test.ts`
- Modify: `package.json` (script `test:guests`)

**Interfaces:**
- Consumes: nothing
- Produces:
  - `export const GUEST_NAME_MAX = 120`
  - `export const GUEST_GROUP_LABEL_MAX = 80`
  - `export function normalizePersonName(value: string): string`
  - `export function validateGuestFullName(value: unknown): { ok: true; value: string; normalized: string } | { ok: false; error: string }`

- [ ] **Step 1: Add test script and failing tests**

In `package.json` scripts add:

```json
"test:guests": "node --experimental-strip-types --test lib/content/guest-name.test.ts lib/content/rsvp-match.test.ts"
```

Create `lib/content/guest-name.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizePersonName,
  validateGuestFullName,
} from "./guest-name.ts";

describe("normalizePersonName", () => {
  it("lowercases, strips accents and collapses spaces", () => {
    assert.equal(
      normalizePersonName("  Marcelo   HENRIQUE Colombo "),
      "marcelo henrique colombo",
    );
    assert.equal(normalizePersonName("José da Silva"), "jose da silva");
  });
});

describe("validateGuestFullName", () => {
  it("accepts two or more words up to 120 chars", () => {
    const result = validateGuestFullName("Marcelo Henrique Colombo");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value, "Marcelo Henrique Colombo");
      assert.equal(result.normalized, "marcelo henrique colombo");
    }
  });

  it("rejects empty, one word, and oversize", () => {
    assert.equal(validateGuestFullName("").ok, false);
    assert.equal(validateGuestFullName("Marcelo").ok, false);
    assert.equal(validateGuestFullName("A ".repeat(70) + "B").ok, false);
  });
});
```

- [ ] **Step 2: Run tests — they must fail**

```bash
npm run test:guests
```

Expected: `ERR_MODULE_NOT_FOUND` for `./guest-name.ts`.

- [ ] **Step 3: Implement `lib/content/guest-name.ts`**

```ts
export const GUEST_NAME_MAX = 120;
export const GUEST_GROUP_LABEL_MAX = 80;

export function normalizePersonName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function validateGuestFullName(
  value: unknown,
):
  | { ok: true; value: string; normalized: string }
  | { ok: false; error: string } {
  const trimmed = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!trimmed) {
    return { ok: false, error: "Preencha o nome completo." };
  }
  if (trimmed.length > GUEST_NAME_MAX) {
    return {
      ok: false,
      error: `O nome pode ter no máximo ${GUEST_NAME_MAX} caracteres.`,
    };
  }
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length < 2) {
    return { ok: false, error: "Informe nome e sobrenome." };
  }
  return {
    ok: true,
    value: trimmed,
    normalized: normalizePersonName(trimmed),
  };
}
```

- [ ] **Step 4: Run tests — they must pass**

```bash
npm run test:guests
```

Expected: guest-name tests pass; rsvp-match.test.ts may still be missing (add an empty file or wait for Task 5). If the glob fails on missing `rsvp-match.test.ts`, temporarily list only `guest-name.test.ts` in the script until Task 5, then add the second file.

- [ ] **Step 5: Commit (only if the user asked)**

```bash
git add lib/content/guest-name.ts lib/content/guest-name.test.ts package.json
git commit -m "Add guest name normalization and validation."
```

---

### Task 2: Schema Neon (groups, guests, unmatched)

**Files:**
- Modify: `lib/db/schema.ts` (append after `contentSeed`)
- Create: `drizzle/0002_guest_rsvp.sql` via `npm run db:generate`
- Apply: `node --env-file=.env.local ./node_modules/drizzle-kit/bin.cjs migrate`

**Interfaces:**
- Consumes: nothing from Task 1
- Produces: tables `guest_groups`, `guests`, `unmatched_rsvps`; enum `guest_status`

- [ ] **Step 1: Append to `lib/db/schema.ts`**

```ts
export const guestStatusEnum = pgEnum("guest_status", [
  "pending",
  "confirmed",
  "declined",
]);

export const guestGroups = pgTable("guest_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  nameNormalized: text("name_normalized").notNull(),
  groupId: uuid("group_id").references(() => guestGroups.id, {
    onDelete: "set null",
  }),
  status: guestStatusEnum("status").notNull().default("pending"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const unmatchedRsvps = pgTable("unmatched_rsvps", {
  id: uuid("id").primaryKey().defaultRandom(),
  typedName: text("typed_name").notNull(),
  nameNormalized: text("name_normalized").notNull(),
  attending: boolean("attending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

Add a unique index on `unmatched_rsvps.name_normalized` in the generated SQL if drizzle-kit does not (needed for upsert). If generate misses it, edit the SQL:

```sql
CREATE UNIQUE INDEX "unmatched_rsvps_name_normalized_idx" ON "unmatched_rsvps" ("name_normalized");
CREATE INDEX "guests_name_normalized_idx" ON "guests" ("name_normalized");
```

- [ ] **Step 2: Generate and apply**

```bash
npm run db:generate
node --env-file=.env.local ./node_modules/drizzle-kit/bin.cjs migrate
```

Expected: `migrations applied successfully`. Do not print `DATABASE_URL`.

- [ ] **Step 3: Commit (only if asked)**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "Add guest list and unmatched RSVP tables."
```

---

### Task 3: Camada `lib/content/guests.ts`

**Files:**
- Create: `lib/content/guests.ts`

**Interfaces:**
- Consumes: `validateGuestFullName`, `normalizePersonName`, `GUEST_GROUP_LABEL_MAX`; schema tables; `requireDb`
- Produces types and functions listed below

```ts
export type GuestStatus = "pending" | "confirmed" | "declined";

export type AdminGuest = {
  id: string;
  fullName: string;
  groupId: string | null;
  status: GuestStatus;
  respondedAt: string | null;
};

export type AdminGuestGroup = {
  id: string;
  label: string;
  sortOrder: number;
};

export type AdminUnmatched = {
  id: string;
  typedName: string;
  attending: boolean;
  createdAt: string;
};

export type GuestBoard = {
  groups: AdminGuestGroup[];
  guests: AdminGuest[];
  unmatched: AdminUnmatched[];
};

export async function loadGuestBoard(): Promise<GuestBoard>
export async function createGuest(fullName: string, groupId?: string | null): Promise<void>
export async function updateGuest(id: string, fullName: string, groupId: string | null): Promise<void>
export async function deleteGuest(id: string): Promise<void>
export async function createGuestGroup(label: string): Promise<void>
export async function renameGuestGroup(id: string, label: string): Promise<void>
export async function deleteGuestGroup(id: string): Promise<void>
export async function setGuestGroup(guestId: string, groupId: string | null): Promise<void>
export async function linkUnmatched(unmatchedId: string, guestId: string): Promise<void>
export async function createGuestFromUnmatched(unmatchedId: string, groupId?: string | null): Promise<void>
export async function discardUnmatched(unmatchedId: string): Promise<void>
export async function suggestGuests(query: string): Promise<{ id: string; fullName: string }[]>
export async function applyPublicRsvp(input: {
  name: string;
  attending: boolean;
  guestId?: string | null;
}): Promise<void>
```

- [ ] **Step 1: Implement the module**

Rules:
- `createGuest` / `updateGuest` use `validateGuestFullName`; throw `Error` with the Portuguese `error` string if invalid (actions catch it).
- Group label: trim, 1…`GUEST_GROUP_LABEL_MAX`, error `"Preencha o nome do grupo."` / max message.
- `createGuestGroup` sets `sortOrder` to `max+1`.
- `deleteGuestGroup` only deletes the group row (FK set null).
- `linkUnmatched`: load unmatched; set guest `status` to `confirmed` if `attending` else `declined`; set `respondedAt = now()`; delete unmatched. Throw `"Não foi possível salvar. Tente de novo em instantes."` if missing ids.
- `createGuestFromUnmatched`: insert guest with `typedName` + status from attending; delete unmatched.
- `suggestGuests`: `normalizePersonName(query)`; if length `< 2` return `[]`; `ilike`/`like` on `name_normalized` containing the needle; `limit 8`; select only `id, fullName`. With neon-http use `sql` or `like` from drizzle: `ilike(guests.nameNormalized, %needle%)` — if dialect has no ilike, use `like` on already-normalized column (`%${needle}%`).
- `applyPublicRsvp`: validate name; `resolveRsvpTarget` (Task 5 — if Task 3 lands first, inline the same rules then move in Task 5):  
  1. If `guestId` exists and that guest’s `nameNormalized ===` typed normalized → update that guest.  
  2. Else if **exactly one** guest has that `nameNormalized` → update that guest.  
  3. Else upsert unmatched by `nameNormalized` (`onConflictDoUpdate` attending + typedName + updatedAt).  
  Guest update: status confirmed/declined, `respondedAt = now()`, `updatedAt = now()`.

Use `eq`, `asc`, `max` like `lib/content/gifts.ts`. `requireDb()` for writes. `getDb()` null → `suggestGuests` returns `[]`; `applyPublicRsvp` throws the generic save error.

- [ ] **Step 2: Commit (only if asked)**

---

### Task 4: Match puro + testes

**Files:**
- Create: `lib/content/rsvp-match.ts`
- Create: `lib/content/rsvp-match.test.ts`
- Modify: `lib/content/guests.ts` to call `resolveRsvpTarget`
- Modify: `package.json` `test:guests` to include the new test file

**Interfaces:**
- Consumes: `normalizePersonName`, `validateGuestFullName`
- Produces:

```ts
export type RsvpGuestRef = { id: string; nameNormalized: string };

export type RsvpTarget =
  | { kind: "guest"; id: string }
  | { kind: "unmatched"; typedName: string; nameNormalized: string };

export function resolveRsvpTarget(
  input: { name: string; guestId?: string | null },
  guests: RsvpGuestRef[],
): { ok: true; target: RsvpTarget } | { ok: false; error: string }
```

- [ ] **Step 1: Failing tests** in `lib/content/rsvp-match.test.ts`

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveRsvpTarget } from "./rsvp-match.ts";

const marceloHenrique = {
  id: "g1",
  nameNormalized: "marcelo henrique colombo",
};
const mariaA = { id: "g2", nameNormalized: "maria silva" };
const mariaB = { id: "g3", nameNormalized: "maria silva" };

describe("resolveRsvpTarget", () => {
  it("links guestId when the typed name matches that guest", () => {
    const result = resolveRsvpTarget(
      { name: "Marcelo Henrique Colombo", guestId: "g1" },
      [marceloHenrique],
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.target, { kind: "guest", id: "g1" });
  });

  it("does not use guestId if the typed name does not match that person", () => {
    const result = resolveRsvpTarget(
      { name: "Marcelo Colombo", guestId: "g1" },
      [marceloHenrique],
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.target.kind, "unmatched");
      if (result.target.kind === "unmatched") {
        assert.equal(result.target.nameNormalized, "marcelo colombo");
      }
    }
  });

  it("links a unique exact normalized name without guestId", () => {
    const result = resolveRsvpTarget(
      { name: "Marcelo Henrique Colombo" },
      [marceloHenrique],
    );
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.target, { kind: "guest", id: "g1" });
  });

  it("keeps homonyms unmatched without guestId", () => {
    const result = resolveRsvpTarget({ name: "Maria Silva" }, [mariaA, mariaB]);
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.target.kind, "unmatched");
  });

  it("rejects a single-word name", () => {
    const result = resolveRsvpTarget({ name: "Marcelo" }, [marceloHenrique]);
    assert.equal(result.ok, false);
  });
});
```

- [ ] **Step 2: Run — fail** (`npm run test:guests`)

- [ ] **Step 3: Implement `rsvp-match.ts`** and switch `applyPublicRsvp` to it (load all guests’ `{id,nameNormalized}` — for suggest we already query; for apply, if the list can grow, load by id first then by normalized equality instead of selecting the whole table:  
  1. validate name  
  2. if guestId: `select` that row; if `nameNormalized` matches → update  
  3. else `select` where `nameNormalized = needle`; if length === 1 → update that id  
  4. else upsert unmatched  

  That is equivalent to `resolveRsvpTarget` with a small candidate set: pass `[foundById]` plus `foundByNormalized` into the pure function. Do **not** load every guest.

- [ ] **Step 4: Tests pass**

- [ ] **Step 5: Commit (only if asked)**

---

### Task 5: Server Actions + página admin

**Files:**
- Create: `app/actions/guests.ts` (copy the session/error pattern from `app/actions/gifts.ts`)
- Create: `app/admin/(panel)/convidados/page.tsx`
- Create: `components/admin/GuestPanel.tsx`
- Modify: `components/admin/AdminChrome.tsx` — add `{ href: "/admin/convidados", label: "Convidados" }` to `LINKS`
- Modify: `app/admin/(panel)/page.tsx` — card Convidados (“Lista e RSVP”)

**Interfaces:**
- Consumes: `GuestBoard` and mutations from `lib/content/guests.ts`
- Produces: `createGuestAction`, `updateGuestAction`, `deleteGuestAction`, `createGuestGroupAction`, `renameGuestGroupAction`, `deleteGuestGroupAction`, `setGuestGroupAction`, `linkUnmatchedAction`, `createGuestFromUnmatchedAction`, `discardUnmatchedAction`  
  State type: `{ ok: true } | { ok: false; error: string } | null`  
  `revalidatePath("/admin/convidados")` only (RSVP is not on the home HTML).

- [ ] **Step 1: Actions** — each mutation: `requireAdminSession()`, try/catch, `console.error("[guests]")` without names, return Portuguese generic on unexpected throw.

Form fields:
- guest: `id?`, `fullName`, `groupId` (empty string → null)
- group: `id?`, `label`
- unmatched: `id`, `guestId` (link), optional `groupId` (create from unmatched)

- [ ] **Step 2: RSC page**

```tsx
import { requireAdminSession } from "@/lib/admin-auth";
import { loadGuestBoard } from "@/lib/content/guests";
import { GuestPanel } from "@/components/admin/GuestPanel";

export default async function ConvidadosPage() {
  await requireAdminSession();
  const board = await loadGuestBoard();
  const confirmed = board.guests.filter((g) => g.status === "confirmed").length;
  const declined = board.guests.filter((g) => g.status === "declined").length;
  const pending = board.guests.length - confirmed - declined;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Convidados</h1>
        <p className="mt-2 text-navy/75">
          {confirmed} confirmaram · {declined} não vão · {pending} ainda não
          responderam
          {board.unmatched.length
            ? ` · ${board.unmatched.length} confirmação(ões) avulsa(s)`
            : ""}
        </p>
      </div>
      <GuestPanel board={board} />
    </div>
  );
}
```

- [ ] **Step 3: `GuestPanel` (client)**  
  Two sections on one page: **Lista** and **Confirmações avulsas**.  
  Lista: local search input; “Adicionar convidado” dialog (name + optional group select); “Novo grupo” dialog (label); guests grouped under `h2` of group label, then “Sem grupo”; each row shows status in Portuguese (`Ainda não respondeu` / `Confirmou` / `Não vai`), select to change group, Editar, Remover (dialog).  
  Avulsas: card with typed name, “Vou” or “Não vai”, Vincular (select guest), Criar convidado, Descartar (dialog).  
  Reuse `adminFieldClass`, `Dialog` like `GiftList.tsx`, buttons gold/navy. `router.refresh()` after success. min-h-11 controls.

- [ ] **Step 4: Manual check** — `npm run lint` on new files; open `/admin/convidados` after login; add a person; see pending.

- [ ] **Step 5: Commit (only if asked)**

---

### Task 6: APIs públicas suggest + POST

**Files:**
- Create: `lib/rsvp-rate-limit.ts` — move the in-memory map from `app/api/rsvp/route.ts` (`5 / 60s / IP`)
- Create: `lib/rsvp-sheet-mirror.ts`
- Create: `app/api/rsvp/suggest/route.ts`
- Modify: `app/api/rsvp/route.ts` — replace Apps-Script-first flow

**Interfaces:**
- `export function isRsvpRateLimited(ip: string): boolean`
- `export function mirrorRsvpToSheet(payload: { nome: string; attending: boolean }): Promise<void>` — if `GOOGLE_APPS_SCRIPT_RSVP_URL` empty, return; else POST JSON `{ nome, attending }`, timeout 30s, swallow errors with `console.error("[rsvp] mirror")` (no name in log)

- [ ] **Step 1: `GET /api/rsvp/suggest`**

```ts
export async function GET(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ guests: [] }, { status: 403 });
  }
  if (isRsvpRateLimited(getClientIp(request))) {
    return NextResponse.json({ guests: [] }, { status: 429 });
  }
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const guests = await suggestGuests(q);
  return NextResponse.json({ guests });
}
```

- [ ] **Step 2: Rewrite `POST /api/rsvp`**

Body: `{ name?: string, attending?: boolean, guestId?: string }`.  
`attending` must be boolean; else 400 `"Escolha se você vai ou não vai."`  
Call `applyPublicRsvp`. On success: `void mirrorRsvpToSheet(...)` (do not await failure — fire-and-await but catch inside mirror). Return `{ success: true }`.  
If DB throws: 503 `"Tente de novo em instantes."` — never `{ success: true }` without Neon write.  
Keep origin + rate limit. Remove the requirement that `GOOGLE_APPS_SCRIPT_RSVP_URL` is set (503 “em breve” goes away when DB is configured). If `getDb()` is null: 503 generic.

- [ ] **Step 3: Smoke without session**

```bash
curl -sS "http://127.0.0.1:3002/api/rsvp/suggest?q=ma"
# { "guests": [] } or matches; never full dump

curl -sS -X POST http://127.0.0.1:3002/api/rsvp \
  -H 'content-type: application/json' \
  -d '{"name":"Fulano Teste Silva","attending":true}'
# { "success": true } if DATABASE_URL present
```

- [ ] **Step 4: Commit (only if asked)**

---

### Task 7: Modal público

**Files:**
- Modify: `components/RsvpModal.tsx`

**Interfaces:**
- Consumes: `GET /api/rsvp/suggest?q=`, `POST /api/rsvp` `{ name, attending, guestId? }`

- [ ] **Step 1: Replace form fields**

State:

```ts
const [nome, setNome] = useState("");
const [guestId, setGuestId] = useState<string | null>(null);
const [attending, setAttending] = useState<"" | "sim" | "nao">("");
const [suggestions, setSuggestions] = useState<{ id: string; fullName: string }[]>([]);
```

On nome change: clear `guestId` unless the text still equals the selected suggestion’s `fullName`. Debounce 200ms; if `normalize` length < 2, `suggestions = []`; else fetch suggest and set list (`ul` under the input, `button` per item, click sets nome + guestId and closes list). Keyboard: Arrow/Enter optional; mouse/touch required.

Attending: two `Button` type="button" toggles, `aria-pressed`, labels **Vou** / **Não vou**. Submit disabled until nome valid (2 words) and attending chosen.

POST body: `{ name: nome.trim(), attending: attending === "sim", guestId }`. Success UI stays the existing heart/confetti. Remove email, acompanhante, microônibus.

Errors: keep toast Portuguese. Do not toast “nome não encontrado”.

- [ ] **Step 2: Browser** — 360px and desktop: type, pick suggestion, Vou, success; type unknown full name, Não vou, success.

- [ ] **Step 3: Commit (only if asked)**

---

### Task 8: Verificação ponta a ponta

**Files:** none new unless a bugfix.

- [ ] **Step 1: `npm run test:guests`** — all pass  
- [ ] **Step 2: `npm run build`** — TypeScript clean (the previous production break was `instanceof` on Buffer; do not regress)  
- [ ] **Step 3: Flow from the spec**
  1. Painel: criar “Marcelo Henrique Colombo” → pendente  
  2. Site: digitar “Marce”, escolher a sugestão, Vou → painel Confirmou  
  3. Site: “Marcelo Colombo” + Vou → lista principal ainda só o Henrique confirmado; avulsa com “Marcelo Colombo”  
  4. Vincular avulsa ao Henrique → avulsa some (status stays confirmou)  
  5. Criar grupo “Família Colombo”, associar a pessoa, ver agrupado  
  6. Descartar uma avulsa nova some só da fila  
  7. Reenviar o mesmo convidado como Não vou substitui o status  
- [ ] **Step 4: Viewport 360** on `/admin/convidados` and RSVP modal  
- [ ] **Step 5: Confirm logs** in a fake failure do not include the guest name

---

## Spec coverage

| Spec | Task |
|------|------|
| CRUD convidados + status | 3, 5 |
| Grupos só visual | 2, 3, 5 |
| Typeahead 2 chars / 8 / só nome | 3, 6, 7 |
| Vou / não vou, sem e-mail | 7 |
| Avulsas aceitar + vincular/criar/descartar | 3, 5, 6 |
| Marcelo Colombo ≠ Henrique | 4 |
| Homônimo sem id → avulsa | 4 |
| Neon antes do Google | 6 |
| Banco fora → sem sucesso falso | 6 |
| LGPD logs | 5, 6 |
| Chrome Convidados | 5 |
| 360px | 5, 7, 8 |

## Placeholder scan

Nenhum TBD. `rsvp-match.test.ts` entra na Task 4; se Task 1 referenciar o arquivo cedo, o script de teste inclui só o que existir até a Task 4 completar o glob.
