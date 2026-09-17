import { and, asc, eq, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { sitePhotos } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/content/seed";
import { deleteOrphanMedia } from "@/lib/content/media";
import { publicMediaUrl } from "@/lib/site-media";
import {
  isUuid,
  photoLimit,
  photoLimitMessage,
  type PhotoCollection,
} from "@/lib/content/validation";

export type AdminPhoto = {
  id: string;
  collection: PhotoCollection;
  mediaId: string;
  imageUrl: string;
  sortOrder: number;
};

export async function listPhotos(
  collection: PhotoCollection,
): Promise<AdminPhoto[]> {
  await ensureSeeded();
  const db = requireDb();
  const rows = await db
    .select()
    .from(sitePhotos)
    .where(eq(sitePhotos.collection, collection))
    .orderBy(asc(sitePhotos.sortOrder), asc(sitePhotos.createdAt));
  return rows.map((row) => ({
    id: row.id,
    collection: row.collection,
    mediaId: row.mediaId,
    imageUrl: publicMediaUrl(row.mediaId),
    sortOrder: row.sortOrder,
  }));
}

export async function addPhoto(
  collection: PhotoCollection,
  mediaId: string,
): Promise<void> {
  if (!isUuid(mediaId)) {
    throw new Error("Imagem inválida.");
  }
  const db = requireDb();
  await ensureSeeded();
  const [{ value: count }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(sitePhotos)
    .where(eq(sitePhotos.collection, collection));
  if ((count ?? 0) >= photoLimit(collection)) {
    throw new Error(photoLimitMessage(collection));
  }
  const [{ value: maxOrder }] = await db
    .select({
      value: sql<number>`coalesce(max(${sitePhotos.sortOrder}), -1)`,
    })
    .from(sitePhotos)
    .where(eq(sitePhotos.collection, collection));
  await db.insert(sitePhotos).values({
    collection,
    mediaId,
    sortOrder: (maxOrder ?? -1) + 1,
  });
}

export async function deletePhoto(id: string): Promise<void> {
  if (!isUuid(id)) {
    throw new Error("Foto não encontrada.");
  }
  const db = requireDb();
  const [current] = await db
    .select()
    .from(sitePhotos)
    .where(eq(sitePhotos.id, id))
    .limit(1);
  if (!current) {
    throw new Error("Foto não encontrada.");
  }
  await db.delete(sitePhotos).where(eq(sitePhotos.id, id));
  await deleteOrphanMedia(current.mediaId);
}

export async function reorderPhotos(
  collection: PhotoCollection,
  ids: string[],
): Promise<void> {
  const db = requireDb();
  const existing = await db
    .select({ id: sitePhotos.id })
    .from(sitePhotos)
    .where(eq(sitePhotos.collection, collection));
  const existingSet = new Set(existing.map((row) => row.id));
  const incoming = new Set(ids);
  if (
    existingSet.size !== incoming.size ||
    [...existingSet].some((id) => !incoming.has(id))
  ) {
    throw new Error("A ordem das fotos mudou. Recarregue e tente de novo.");
  }
  await Promise.all(
    ids.map((id, index) =>
      db
        .update(sitePhotos)
        .set({ sortOrder: index })
        .where(and(eq(sitePhotos.id, id), eq(sitePhotos.collection, collection))),
    ),
  );
}
