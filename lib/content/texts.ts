import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { siteTextBlocks } from "@/lib/db/schema";
import { ensureSeeded } from "@/lib/content/seed";
import {
  HISTORIA_FIELD_MAX,
  SCALAR_TEXT_MAX,
  isTextBlockKey,
  trimRequired,
  validateParagraphs,
  type TextBlockKey,
} from "@/lib/content/validation";

export type ScalarBlock = { key: "hero_message" | "presentes_intro"; value: string };
export type ParagraphBlock = {
  key: "grande_dia" | "traje";
  paragraphs: string[];
};
export type HistoriaBlock = {
  key: "nossa_historia";
  titulo: string;
  subtitulo: string;
  assinatura: string;
  paragraphs: string[];
};

export type TextBlocks = {
  hero_message: ScalarBlock;
  presentes_intro: ScalarBlock;
  grande_dia: ParagraphBlock;
  traje: ParagraphBlock;
  nossa_historia: HistoriaBlock;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asParagraphs(value: unknown): string[] {
  if (!Array.isArray(value)) return [""];
  const paragraphs = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return paragraphs.length > 0 ? paragraphs : [""];
}

export async function getTextBlocks(): Promise<TextBlocks> {
  await ensureSeeded();
  const db = requireDb();
  const rows = await db.select().from(siteTextBlocks);
  const byKey = Object.fromEntries(rows.map((row) => [row.key, row.payload]));

  const hero = asRecord(byKey.hero_message);
  const intro = asRecord(byKey.presentes_intro);
  const grande = asRecord(byKey.grande_dia);
  const traje = asRecord(byKey.traje);
  const historia = asRecord(byKey.nossa_historia);

  return {
    hero_message: {
      key: "hero_message",
      value: asString(hero.value),
    },
    presentes_intro: {
      key: "presentes_intro",
      value: asString(intro.value),
    },
    grande_dia: {
      key: "grande_dia",
      paragraphs: asParagraphs(grande.paragraphs),
    },
    traje: {
      key: "traje",
      paragraphs: asParagraphs(traje.paragraphs),
    },
    nossa_historia: {
      key: "nossa_historia",
      titulo: asString(historia.titulo),
      subtitulo: asString(historia.subtitulo),
      assinatura: asString(historia.assinatura),
      paragraphs: asParagraphs(historia.paragraphs),
    },
  };
}

export function parseTextBlockPayload(
  formData: FormData,
): { key: TextBlockKey; payload: unknown } | { error: string } {
  const keyRaw = String(formData.get("key") ?? "");
  if (!isTextBlockKey(keyRaw)) {
    return { error: "Bloco de texto inválido." };
  }

  if (keyRaw === "hero_message" || keyRaw === "presentes_intro") {
    const label =
      keyRaw === "hero_message"
        ? "a mensagem da entrada"
        : "a introdução dos presentes";
    const value = trimRequired(formData.get("value"), label, SCALAR_TEXT_MAX);
    if (!value.ok) return { error: value.error };
    return { key: keyRaw, payload: { value: value.value } };
  }

  if (keyRaw === "grande_dia" || keyRaw === "traje") {
    const label = keyRaw === "grande_dia" ? "O Grande Dia" : "Traje";
    const paragraphs = validateParagraphs(
      formData.getAll("paragraphs"),
      label,
    );
    if (!paragraphs.ok) return { error: paragraphs.error };
    return { key: keyRaw, payload: { paragraphs: paragraphs.value } };
  }

  const titulo = trimRequired(formData.get("titulo"), "o título", HISTORIA_FIELD_MAX);
  if (!titulo.ok) return { error: titulo.error };
  const subtitulo = trimRequired(
    formData.get("subtitulo"),
    "o subtítulo",
    HISTORIA_FIELD_MAX,
  );
  if (!subtitulo.ok) return { error: subtitulo.error };
  const assinatura = trimRequired(
    formData.get("assinatura"),
    "a assinatura",
    HISTORIA_FIELD_MAX,
  );
  if (!assinatura.ok) return { error: assinatura.error };
  const paragraphs = validateParagraphs(
    formData.getAll("paragraphs"),
    "Nossa História",
  );
  if (!paragraphs.ok) return { error: paragraphs.error };
  return {
    key: keyRaw,
    payload: {
      titulo: titulo.value,
      subtitulo: subtitulo.value,
      assinatura: assinatura.value,
      paragraphs: paragraphs.value,
    },
  };
}

export async function saveTextBlock(
  key: TextBlockKey,
  payload: unknown,
): Promise<void> {
  const db = requireDb();
  await db
    .update(siteTextBlocks)
    .set({ payload, updatedAt: new Date() })
    .where(eq(siteTextBlocks.key, key));
}
