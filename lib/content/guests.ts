import { asc, eq, like, max } from "drizzle-orm";
import { getDb, requireDb } from "@/lib/db/client";
import { guestGroups, guests, unmatchedRsvps } from "@/lib/db/schema";
import { isUuid } from "@/lib/content/validation";
import {
  GUEST_GROUP_LABEL_MAX,
  normalizePersonName,
  validateGuestFullName,
} from "@/lib/content/guest-name";
import { resolveRsvpTarget } from "@/lib/content/rsvp-match";

const SAVE_ERROR = "Não foi possível salvar. Tente de novo em instantes.";

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

function attendingStatus(attending: boolean): GuestStatus {
  return attending ? "confirmed" : "declined";
}

function parseGroupLabel(value: unknown): string {
  const trimmed = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!trimmed) {
    throw new Error("Preencha o nome do grupo.");
  }
  if (trimmed.length > GUEST_GROUP_LABEL_MAX) {
    throw new Error(
      `O nome do grupo pode ter no máximo ${GUEST_GROUP_LABEL_MAX} caracteres.`,
    );
  }
  return trimmed;
}

function likeContains(needle: string): string {
  return `%${needle.replace(/[%_\\]/g, "\\$&")}%`;
}

export async function loadGuestBoard(): Promise<GuestBoard> {
  const db = requireDb();
  const [groupRows, guestRows, unmatchedRows] = await Promise.all([
    db
      .select()
      .from(guestGroups)
      .orderBy(asc(guestGroups.sortOrder), asc(guestGroups.createdAt)),
    db
      .select()
      .from(guests)
      .orderBy(asc(guests.fullName), asc(guests.createdAt)),
    db
      .select()
      .from(unmatchedRsvps)
      .orderBy(asc(unmatchedRsvps.createdAt)),
  ]);

  return {
    groups: groupRows.map((row) => ({
      id: row.id,
      label: row.label,
      sortOrder: row.sortOrder,
    })),
    guests: guestRows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      groupId: row.groupId,
      status: row.status,
      respondedAt: row.respondedAt ? row.respondedAt.toISOString() : null,
    })),
    unmatched: unmatchedRows.map((row) => ({
      id: row.id,
      typedName: row.typedName,
      attending: row.attending,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function createGuest(
  fullName: string,
  groupId?: string | null,
): Promise<void> {
  const parsed = validateGuestFullName(fullName);
  if (!parsed.ok) throw new Error(parsed.error);
  const db = requireDb();
  const group = groupId && isUuid(groupId) ? groupId : null;
  await db.insert(guests).values({
    fullName: parsed.value,
    nameNormalized: parsed.normalized,
    groupId: group,
    status: "pending",
  });
}

export async function updateGuest(
  id: string,
  fullName: string,
  groupId: string | null,
): Promise<void> {
  if (!isUuid(id)) throw new Error(SAVE_ERROR);
  const parsed = validateGuestFullName(fullName);
  if (!parsed.ok) throw new Error(parsed.error);
  const db = requireDb();
  const [current] = await db
    .select({ id: guests.id })
    .from(guests)
    .where(eq(guests.id, id))
    .limit(1);
  if (!current) throw new Error(SAVE_ERROR);
  await db
    .update(guests)
    .set({
      fullName: parsed.value,
      nameNormalized: parsed.normalized,
      groupId: groupId && isUuid(groupId) ? groupId : null,
      updatedAt: new Date(),
    })
    .where(eq(guests.id, id));
}

export async function deleteGuest(id: string): Promise<void> {
  if (!isUuid(id)) throw new Error(SAVE_ERROR);
  const db = requireDb();
  await db.delete(guests).where(eq(guests.id, id));
}

export async function createGuestGroup(label: string): Promise<void> {
  const parsed = parseGroupLabel(label);
  const db = requireDb();
  const [agg] = await db
    .select({ value: max(guestGroups.sortOrder) })
    .from(guestGroups);
  await db.insert(guestGroups).values({
    label: parsed,
    sortOrder: (agg?.value ?? -1) + 1,
  });
}

export async function renameGuestGroup(id: string, label: string): Promise<void> {
  if (!isUuid(id)) throw new Error(SAVE_ERROR);
  const parsed = parseGroupLabel(label);
  const db = requireDb();
  await db
    .update(guestGroups)
    .set({ label: parsed })
    .where(eq(guestGroups.id, id));
}

export async function deleteGuestGroup(id: string): Promise<void> {
  if (!isUuid(id)) throw new Error(SAVE_ERROR);
  const db = requireDb();
  await db.delete(guestGroups).where(eq(guestGroups.id, id));
}

export async function setGuestGroup(
  guestId: string,
  groupId: string | null,
): Promise<void> {
  if (!isUuid(guestId)) throw new Error(SAVE_ERROR);
  const db = requireDb();
  await db
    .update(guests)
    .set({
      groupId: groupId && isUuid(groupId) ? groupId : null,
      updatedAt: new Date(),
    })
    .where(eq(guests.id, guestId));
}

export async function linkUnmatched(
  unmatchedId: string,
  guestId: string,
): Promise<void> {
  if (!isUuid(unmatchedId) || !isUuid(guestId)) throw new Error(SAVE_ERROR);
  const db = requireDb();
  const [open] = await db
    .select()
    .from(unmatchedRsvps)
    .where(eq(unmatchedRsvps.id, unmatchedId))
    .limit(1);
  const [guest] = await db
    .select({ id: guests.id })
    .from(guests)
    .where(eq(guests.id, guestId))
    .limit(1);
  if (!open || !guest) throw new Error(SAVE_ERROR);
  const now = new Date();
  await db
    .update(guests)
    .set({
      status: attendingStatus(open.attending),
      respondedAt: now,
      updatedAt: now,
    })
    .where(eq(guests.id, guestId));
  await db.delete(unmatchedRsvps).where(eq(unmatchedRsvps.id, unmatchedId));
}

export async function createGuestFromUnmatched(
  unmatchedId: string,
  groupId?: string | null,
): Promise<void> {
  if (!isUuid(unmatchedId)) throw new Error(SAVE_ERROR);
  const db = requireDb();
  const [open] = await db
    .select()
    .from(unmatchedRsvps)
    .where(eq(unmatchedRsvps.id, unmatchedId))
    .limit(1);
  if (!open) throw new Error(SAVE_ERROR);
  const parsed = validateGuestFullName(open.typedName);
  if (!parsed.ok) throw new Error(parsed.error);
  const now = new Date();
  await db.insert(guests).values({
    fullName: parsed.value,
    nameNormalized: parsed.normalized,
    groupId: groupId && isUuid(groupId) ? groupId : null,
    status: attendingStatus(open.attending),
    respondedAt: now,
  });
  await db.delete(unmatchedRsvps).where(eq(unmatchedRsvps.id, unmatchedId));
}

export async function discardUnmatched(unmatchedId: string): Promise<void> {
  if (!isUuid(unmatchedId)) throw new Error(SAVE_ERROR);
  const db = requireDb();
  await db.delete(unmatchedRsvps).where(eq(unmatchedRsvps.id, unmatchedId));
}

export async function suggestGuests(
  query: string,
): Promise<{ id: string; fullName: string }[]> {
  const db = getDb();
  if (!db) return [];
  const needle = normalizePersonName(query);
  if (needle.length < 2) return [];
  return db
    .select({ id: guests.id, fullName: guests.fullName })
    .from(guests)
    .where(like(guests.nameNormalized, likeContains(needle)))
    .orderBy(asc(guests.fullName))
    .limit(8);
}

export async function applyPublicRsvp(input: {
  name: string;
  attending: boolean;
  guestId?: string | null;
}): Promise<void> {
  const parsed = validateGuestFullName(input.name);
  if (!parsed.ok) throw new Error(parsed.error);
  const db = requireDb();

  const candidates: { id: string; nameNormalized: string }[] = [];
  if (input.guestId && isUuid(input.guestId)) {
    const [byId] = await db
      .select({
        id: guests.id,
        nameNormalized: guests.nameNormalized,
      })
      .from(guests)
      .where(eq(guests.id, input.guestId))
      .limit(1);
    if (byId) candidates.push(byId);
  }
  const sameName = await db
    .select({
      id: guests.id,
      nameNormalized: guests.nameNormalized,
    })
    .from(guests)
    .where(eq(guests.nameNormalized, parsed.normalized));
  for (const row of sameName) {
    if (!candidates.some((item) => item.id === row.id)) {
      candidates.push(row);
    }
  }

  const resolved = resolveRsvpTarget(
    { name: parsed.value, guestId: input.guestId },
    candidates,
  );
  if (!resolved.ok) throw new Error(resolved.error);

  const now = new Date();
  if (resolved.target.kind === "guest") {
    await db
      .update(guests)
      .set({
        status: attendingStatus(input.attending),
        respondedAt: now,
        updatedAt: now,
      })
      .where(eq(guests.id, resolved.target.id));
    return;
  }

  await db
    .insert(unmatchedRsvps)
    .values({
      typedName: resolved.target.typedName,
      nameNormalized: resolved.target.nameNormalized,
      attending: input.attending,
    })
    .onConflictDoUpdate({
      target: unmatchedRsvps.nameNormalized,
      set: {
        typedName: resolved.target.typedName,
        attending: input.attending,
        updatedAt: now,
      },
    });
}
