import { asc, eq, max } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { gifts } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/content/seed";
import { deleteOrphanMedia } from "@/lib/content/media";
import { publicMediaUrl } from "@/lib/site-media";
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  VALUE_MAX,
  isUuid,
  trimOptional,
  trimRequired,
  validatePix,
} from "@/lib/content/validation";

export type AdminGift = {
  id: string;
  title: string;
  description: string;
  pix: string;
  suggestedValue: string;
  imageUrl: string | null;
  mediaId: string | null;
  sortOrder: number;
};

export async function listGifts(): Promise<AdminGift[]> {
  await ensureSeeded();
  const db = requireDb();
  const rows = await db
    .select()
    .from(gifts)
    .orderBy(asc(gifts.sortOrder), asc(gifts.createdAt));
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    pix: row.pix ?? "",
    suggestedValue: row.suggestedValue ?? "",
    imageUrl: row.mediaId ? publicMediaUrl(row.mediaId) : null,
    mediaId: row.mediaId,
    sortOrder: row.sortOrder,
  }));
}

export type GiftInput = {
  title: string;
  description: string;
  pix: string;
  suggestedValue: string;
  mediaId: string | null;
};

export function parseGiftInput(formData: FormData): GiftInput | { error: string } {
  const title = trimRequired(formData.get("title"), "o título", TITLE_MAX);
  if (!title.ok) return { error: title.error };
  const description = trimRequired(
    formData.get("description"),
    "a descrição",
    DESCRIPTION_MAX,
  );
  if (!description.ok) return { error: description.error };
  const pix = validatePix(formData.get("pix"));
  if (!pix.ok) return { error: pix.error };
  const suggestedValue = trimOptional(
    formData.get("suggestedValue"),
    "o valor",
    VALUE_MAX,
  );
  if (!suggestedValue.ok) return { error: suggestedValue.error };
  const mediaRaw = String(formData.get("mediaId") ?? "").trim();
  const mediaId = mediaRaw ? mediaRaw : null;
  if (mediaId && !isUuid(mediaId)) {
    return { error: "Imagem inválida." };
  }
  return {
    title: title.value,
    description: description.value,
    pix: pix.value,
    suggestedValue: suggestedValue.value,
    mediaId,
  };
}

export async function createGift(input: GiftInput): Promise<void> {
  const db = requireDb();
  await ensureSeeded();
  const [agg] = await db.select({ value: max(gifts.sortOrder) }).from(gifts);
  const sortOrder = (agg?.value ?? -1) + 1;
  await db.insert(gifts).values({
    title: input.title,
    description: input.description,
    pix: input.pix || null,
    suggestedValue: input.suggestedValue || null,
    mediaId: input.mediaId,
    sortOrder,
  });
}

export async function updateGift(id: string, input: GiftInput): Promise<void> {
  if (!isUuid(id)) {
    throw new Error("Presente não encontrado.");
  }
  const db = requireDb();
  const [current] = await db.select().from(gifts).where(eq(gifts.id, id)).limit(1);
  if (!current) {
    throw new Error("Presente não encontrado.");
  }
  await db
    .update(gifts)
    .set({
      title: input.title,
      description: input.description,
      pix: input.pix || null,
      suggestedValue: input.suggestedValue || null,
      mediaId: input.mediaId,
      updatedAt: new Date(),
    })
    .where(eq(gifts.id, id));

  if (current.mediaId && current.mediaId !== input.mediaId) {
    await deleteOrphanMedia(current.mediaId);
  }
}

export async function deleteGift(id: string): Promise<void> {
  if (!isUuid(id)) {
    throw new Error("Presente não encontrado.");
  }
  const db = requireDb();
  const [current] = await db.select().from(gifts).where(eq(gifts.id, id)).limit(1);
  if (!current) {
    throw new Error("Presente não encontrado.");
  }
  await db.delete(gifts).where(eq(gifts.id, id));
  if (current.mediaId) {
    await deleteOrphanMedia(current.mediaId);
  }
}

export async function reorderGifts(ids: string[]): Promise<void> {
  const db = requireDb();
  const existing = await db.select({ id: gifts.id }).from(gifts);
  const existingSet = new Set(existing.map((row) => row.id));
  const incoming = new Set(ids);
  if (
    existingSet.size !== incoming.size ||
    [...existingSet].some((id) => !incoming.has(id))
  ) {
    throw new Error("A ordem da lista mudou. Recarregue e tente de novo.");
  }
  await Promise.all(
    ids.map((id, index) =>
      db.update(gifts).set({ sortOrder: index, updatedAt: new Date() }).where(eq(gifts.id, id)),
    ),
  );
}
