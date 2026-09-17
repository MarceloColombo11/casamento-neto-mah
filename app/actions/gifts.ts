"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  createGift,
  deleteGift,
  listGifts,
  parseGiftInput,
  reorderGifts,
  updateGift,
  type AdminGift,
} from "@/lib/content/gifts";

export type GiftActionState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

function failMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível salvar. Tente de novo em instantes.";
}

function publish(): void {
  revalidatePath("/");
  revalidatePath("/admin/presentes");
}

export async function listGiftsAction(): Promise<AdminGift[]> {
  await requireAdminSession();
  return listGifts();
}

export async function createGiftAction(
  _prev: GiftActionState,
  formData: FormData,
): Promise<GiftActionState> {
  await requireAdminSession();
  try {
    const parsed = parseGiftInput(formData);
    if ("error" in parsed) return { ok: false, error: parsed.error };
    await createGift(parsed);
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[gifts] create");
    return { ok: false, error: failMessage(error) };
  }
}

export async function updateGiftAction(
  _prev: GiftActionState,
  formData: FormData,
): Promise<GiftActionState> {
  await requireAdminSession();
  try {
    const id = String(formData.get("id") ?? "");
    const parsed = parseGiftInput(formData);
    if ("error" in parsed) return { ok: false, error: parsed.error };
    await updateGift(id, parsed);
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[gifts] update");
    return { ok: false, error: failMessage(error) };
  }
}

export async function deleteGiftAction(formData: FormData): Promise<GiftActionState> {
  await requireAdminSession();
  try {
    await deleteGift(String(formData.get("id") ?? ""));
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[gifts] delete");
    return { ok: false, error: failMessage(error) };
  }
}

export async function reorderGiftsAction(ids: string[]): Promise<GiftActionState> {
  await requireAdminSession();
  try {
    await reorderGifts(ids);
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[gifts] reorder");
    return { ok: false, error: failMessage(error) };
  }
}
