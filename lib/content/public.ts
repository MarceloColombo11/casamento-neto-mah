import { asc, eq } from "drizzle-orm";
import presentesData from "@/data/presentes.json";
import sobreNosData from "@/data/sobre-nos.json";
import { getDb } from "@/lib/db/client";
import { gifts, sitePhotos, siteTextBlocks } from "@/lib/db/schema";
import { publicMediaUrl } from "@/lib/site-media";
import {
  FALLBACK_GRANDE_DIA,
  FALLBACK_HERO_MESSAGE,
  FALLBACK_PRESENTES_INTRO,
  FALLBACK_TRAJE,
  ensureSeeded,
} from "@/lib/content/seed";

export type PublicGift = {
  id: string;
  nome: string;
  descricao: string;
  valor?: string;
  imagem?: string | null;
};

export type PublicHistoria = {
  imagensCarrossel: string[];
  titulo: string;
  subtitulo: string;
  paragrafos: string[];
  assinatura: string;
};

export type PublicSiteContent = {
  heroMessage: string;
  presentesIntro: string;
  grandeDiaParagraphs: string[];
  trajeParagraphs: string[];
  nossaHistoria: PublicHistoria;
  heroImageUrls: string[];
  gifts: PublicGift[];
};

type JsonGift = {
  id: string;
  nome: string;
  descricao: string;
  valor?: string;
  imagem?: string | null;
};

const FALLBACK_HERO_IMAGES = [
  "/images/hero/01.jpg",
  "/images/hero/02.jpg",
  "/images/hero/03.jpg",
];

function fallbackContent(): PublicSiteContent {
  const giftsFallback: PublicGift[] = (presentesData as JsonGift[]).map(
    ({ id, nome, descricao, valor, imagem }) => ({
      id,
      nome,
      descricao,
      valor,
      imagem: imagem ?? null,
    }),
  );

  return {
    heroMessage: FALLBACK_HERO_MESSAGE,
    presentesIntro: FALLBACK_PRESENTES_INTRO,
    grandeDiaParagraphs: FALLBACK_GRANDE_DIA,
    trajeParagraphs: FALLBACK_TRAJE,
    nossaHistoria: {
      imagensCarrossel: sobreNosData.imagensCarrossel ?? [],
      titulo: sobreNosData.titulo,
      subtitulo: sobreNosData.subtitulo,
      paragrafos: sobreNosData.paragrafos,
      assinatura: sobreNosData.assinatura,
    },
    heroImageUrls: FALLBACK_HERO_IMAGES,
    gifts: giftsFallback,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function asParagraphs(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const paragraphs = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return paragraphs.length > 0 ? paragraphs : fallback;
}

function isMissingRelation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const cause = "cause" in error ? (error as { cause?: { code?: string } }).cause : undefined;
  return cause?.code === "42P01";
}

export async function getPublicSiteContent(): Promise<PublicSiteContent> {
  try {
    const db = getDb();
    if (!db) return fallbackContent();
    await ensureSeeded();

    const [giftRows, photoRows, textRows] = await Promise.all([
      db.select().from(gifts).orderBy(asc(gifts.sortOrder), asc(gifts.createdAt)),
      db
        .select()
        .from(sitePhotos)
        .orderBy(asc(sitePhotos.sortOrder), asc(sitePhotos.createdAt)),
      db.select().from(siteTextBlocks),
    ]);

    const texts = Object.fromEntries(textRows.map((row) => [row.key, row.payload]));
    const heroMessage = asRecord(texts.hero_message);
    const presentesIntro = asRecord(texts.presentes_intro);
    const grandeDia = asRecord(texts.grande_dia);
    const traje = asRecord(texts.traje);
    const historia = asRecord(texts.nossa_historia);

    const heroImageUrls = photoRows
      .filter((row) => row.collection === "hero")
      .map((row) => publicMediaUrl(row.mediaId));
    const historiaUrls = photoRows
      .filter((row) => row.collection === "historia")
      .map((row) => publicMediaUrl(row.mediaId));

    return {
      heroMessage: asString(heroMessage.value, FALLBACK_HERO_MESSAGE),
      presentesIntro: asString(presentesIntro.value, FALLBACK_PRESENTES_INTRO),
      grandeDiaParagraphs: asParagraphs(grandeDia.paragraphs, FALLBACK_GRANDE_DIA),
      trajeParagraphs: asParagraphs(traje.paragraphs, FALLBACK_TRAJE),
      nossaHistoria: {
        imagensCarrossel: historiaUrls,
        titulo: asString(historia.titulo, sobreNosData.titulo),
        subtitulo: asString(historia.subtitulo, sobreNosData.subtitulo),
        paragrafos: asParagraphs(historia.paragraphs, sobreNosData.paragrafos),
        assinatura: asString(historia.assinatura, sobreNosData.assinatura),
      },
      heroImageUrls,
      gifts: giftRows.map((row) => ({
        id: row.id,
        nome: row.title,
        descricao: row.description,
        valor: row.suggestedValue ?? undefined,
        imagem: row.mediaId ? publicMediaUrl(row.mediaId) : null,
      })),
    };
  } catch (error) {
    if (!isMissingRelation(error)) {
      console.error("[content/public] usando fallback");
    }
    return fallbackContent();
  }
}

export async function getGiftPixById(
  id: string,
): Promise<string | null> {
  try {
    const db = getDb();
    if (db) {
      await ensureSeeded();
      const [row] = await db
        .select({ pix: gifts.pix })
        .from(gifts)
        .where(eq(gifts.id, id))
        .limit(1);
      const pix = row?.pix?.trim();
      if (pix) return pix;
      if (row) return null;
    }
  } catch {
    console.error("[content/public] pix db");
  }

  const fromJson = (presentesData as { id: string; chavePix?: string }[]).find(
    (item) => item.id === id,
  );
  const pix = fromJson?.chavePix?.trim();
  return pix || null;
}
