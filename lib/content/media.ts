import { eq } from "drizzle-orm";
import { deleteDriveFile } from "@/lib/drive-resumable";
import { requireDb } from "@/lib/db/client";
import { gifts, siteMedia, sitePhotos } from "@/lib/db/schema";

export async function deleteOrphanMedia(mediaId: string): Promise<void> {
  const db = requireDb();
  const [giftRef] = await db
    .select({ id: gifts.id })
    .from(gifts)
    .where(eq(gifts.mediaId, mediaId))
    .limit(1);
  const [photoRef] = await db
    .select({ id: sitePhotos.id })
    .from(sitePhotos)
    .where(eq(sitePhotos.mediaId, mediaId))
    .limit(1);
  if (giftRef || photoRef) return;

  const [media] = await db
    .select()
    .from(siteMedia)
    .where(eq(siteMedia.id, mediaId))
    .limit(1);
  if (!media) return;

  if (media.source === "drive" && media.driveFileId) {
    try {
      await deleteDriveFile(media.driveFileId);
    } catch {
      console.error("[site-media] falha ao apagar arquivo remoto");
    }
  }

  await db.delete(siteMedia).where(eq(siteMedia.id, mediaId));
}
