"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  createGuest,
  createGuestFromUnmatched,
  createGuestGroup,
  deleteGuest,
  deleteGuestGroup,
  discardUnmatched,
  linkUnmatched,
  renameGuestGroup,
  setGuestGroup,
  updateGuest,
} from "@/lib/content/guests";

export type GuestActionState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

function failMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível salvar. Tente de novo em instantes.";
}

function publish(): void {
  revalidatePath("/admin/convidados");
}

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function optionalId(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export async function createGuestAction(
  _prev: GuestActionState,
  formData: FormData,
): Promise<GuestActionState> {
  await requireAdminSession();
  try {
    await createGuest(field(formData, "fullName"), optionalId(field(formData, "groupId")));
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[guests]");
    return { ok: false, error: failMessage(error) };
  }
}

export async function updateGuestAction(
  _prev: GuestActionState,
  formData: FormData,
): Promise<GuestActionState> {
  await requireAdminSession();
  try {
    await updateGuest(
      field(formData, "id"),
      field(formData, "fullName"),
      optionalId(field(formData, "groupId")),
    );
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[guests]");
    return { ok: false, error: failMessage(error) };
  }
}

export async function deleteGuestAction(formData: FormData): Promise<GuestActionState> {
  await requireAdminSession();
  try {
    await deleteGuest(field(formData, "id"));
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[guests]");
    return { ok: false, error: failMessage(error) };
  }
}

export async function createGuestGroupAction(
  _prev: GuestActionState,
  formData: FormData,
): Promise<GuestActionState> {
  await requireAdminSession();
  try {
    await createGuestGroup(field(formData, "label"));
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[guests]");
    return { ok: false, error: failMessage(error) };
  }
}

export async function renameGuestGroupAction(
  _prev: GuestActionState,
  formData: FormData,
): Promise<GuestActionState> {
  await requireAdminSession();
  try {
    await renameGuestGroup(field(formData, "id"), field(formData, "label"));
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[guests]");
    return { ok: false, error: failMessage(error) };
  }
}

export async function deleteGuestGroupAction(
  formData: FormData,
): Promise<GuestActionState> {
  await requireAdminSession();
  try {
    await deleteGuestGroup(field(formData, "id"));
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[guests]");
    return { ok: false, error: failMessage(error) };
  }
}

export async function setGuestGroupAction(
  formData: FormData,
): Promise<GuestActionState> {
  await requireAdminSession();
  try {
    await setGuestGroup(
      field(formData, "guestId"),
      optionalId(field(formData, "groupId")),
    );
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[guests]");
    return { ok: false, error: failMessage(error) };
  }
}

export async function linkUnmatchedAction(
  formData: FormData,
): Promise<GuestActionState> {
  await requireAdminSession();
  try {
    await linkUnmatched(field(formData, "id"), field(formData, "guestId"));
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[guests]");
    return { ok: false, error: failMessage(error) };
  }
}

export async function createGuestFromUnmatchedAction(
  formData: FormData,
): Promise<GuestActionState> {
  await requireAdminSession();
  try {
    await createGuestFromUnmatched(
      field(formData, "id"),
      optionalId(field(formData, "groupId")),
    );
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[guests]");
    return { ok: false, error: failMessage(error) };
  }
}

export async function discardUnmatchedAction(
  formData: FormData,
): Promise<GuestActionState> {
  await requireAdminSession();
  try {
    await discardUnmatched(field(formData, "id"));
    publish();
    return { ok: true };
  } catch (error) {
    console.error("[guests]");
    return { ok: false, error: failMessage(error) };
  }
}
