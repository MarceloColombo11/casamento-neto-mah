"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  addPhoto,
  deletePhoto,
  listPhotos,
  reorderPhotos,
  type AdminPhoto,
} from "@/lib/content/photos";
import {
  isUuid,
  type PhotoCollection,
} from "@/lib/content/validation";

export type PhotoActionState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

function failMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível salvar. Tente de novo em instantes.";
}

function publish(): void {
  revalidatePath("/");
  revalidatePath("/admin/fotos");
}

function asCollection(value: string): PhotoCollection | null {
  return value === "hero" || value === "historia" ? value : null;
}

export async function listPhotosAction(
  collection: PhotoCollection,
): Promise<AdminPhoto[]> {
  await requireAdminSession();
  return listPhotos(collection);
}

export async function addPhotoAction(
  collection: PhotoCollection,
  mediaId: string,
): Promise<PhotoActionState> {
  await requireAdminSession();
  try {
    if (!isUuid(mediaId)) {
      return { ok: false, error: "Imagem inválida." };
    }
    await addPhoto(collection, mediaId);
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[photos] add");
    return { ok: false, error: failMessage(error) };
  }
}

export async function deletePhotoAction(formData: FormData): Promise<PhotoActionState> {
  await requireAdminSession();
  try {
    await deletePhoto(String(formData.get("id") ?? ""));
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[photos] delete");
    return { ok: false, error: failMessage(error) };
  }
}

export async function reorderPhotosAction(
  collection: PhotoCollection,
  ids: string[],
): Promise<PhotoActionState> {
  await requireAdminSession();
  if (!asCollection(collection)) {
    return { ok: false, error: "Coleção inválida." };
  }
  try {
    await reorderPhotos(collection, ids);
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[photos] reorder");
    return { ok: false, error: failMessage(error) };
  }
}
