"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  getTextBlocks,
  parseTextBlockPayload,
  saveTextBlock,
  type TextBlocks,
} from "@/lib/content/texts";

export type TextActionState =
  | { ok: true }
  | { ok: false; error: string }
  | null;

function failMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível salvar. Tente de novo em instantes.";
}

export async function getTextBlocksAction(): Promise<TextBlocks> {
  await requireAdminSession();
  return getTextBlocks();
}

export async function saveTextBlockAction(
  _prev: TextActionState,
  formData: FormData,
): Promise<TextActionState> {
  await requireAdminSession();
  try {
    const parsed = parseTextBlockPayload(formData);
    if ("error" in parsed) return { ok: false, error: parsed.error };
    await saveTextBlock(parsed.key, parsed.payload);
    revalidatePath("/");
    revalidatePath("/admin/textos");
    return { ok: true };
  } catch (error) {
    console.error("[texts] save");
    return { ok: false, error: failMessage(error) };
  }
}
