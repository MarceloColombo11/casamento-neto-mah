import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import presentesData from "@/data/presentes.json";
import sobreNosData from "@/data/sobre-nos.json";
import { getDb } from "@/lib/db/client";
import {
  contentSeed,
  gifts,
  siteMedia,
  sitePhotos,
  siteTextBlocks,
} from "@/lib/db/schema";
import { isSafeStaticPath } from "@/lib/content/validation";

const HERO_STATIC = [
  "/images/hero/01.jpg",
  "/images/hero/02.jpg",
  "/images/hero/03.jpg",
] as const;

export const FALLBACK_HERO_MESSAGE =
  "Estamos contando os dias para celebrar esse momento com você!";

export const FALLBACK_PRESENTES_INTRO =
  "Se preferir nos presentear, aqui estão algumas sugestões.";

export const FALLBACK_GRANDE_DIA = [
  "Se você chegou até aqui, é porque faz parte da nossa história. Criamos este espaço para compartilhar um pouco do que estamos preparando e reunir todas as informações para esse grande dia.",
];

export const FALLBACK_TRAJE = [
  "Para celebrar esse momento, sugerimos o traje esporte fino. Fiquem à vontade para escolher o estilo e a cor que mais combinarem com vocês, dentro dessa proposta.",
  "Pedimos apenas que evitem terno cinza claro, reservado aos padrinhos, e o azul, escolhido para as madrinhas.",
  "Detalhe importante: como a cerimônia será realizada na grama, recomendamos que as mulheres escolham o salto priorizando modelos que proporcionem mais conforto e estabilidade.",
];

type JsonGift = {
  id: string;
  nome: string;
  descricao: string;
  valor?: string;
  chavePix?: string;
  imagem?: string | null;
};

function publicAbs(rel: string): string {
  return path.join(process.cwd(), "public", rel.replace(/^\//, ""));
}

function staticJpegPathForGift(id: string): string | null {
  const rel = `/imagensPresentes/${id}.jpeg`;
  return existsSync(publicAbs(rel)) ? rel : null;
}

export async function ensureSeeded(): Promise<void> {
  const db = getDb();
  if (!db) return;

  const [already] = await db
    .select({ id: contentSeed.id })
    .from(contentSeed)
    .where(eq(contentSeed.id, "v1"))
    .limit(1);
  if (already) return;

  const [anyText] = await db
    .select({ key: siteTextBlocks.key })
    .from(siteTextBlocks)
    .limit(1);
  if (!anyText) {
    await db.insert(siteTextBlocks).values([
      {
        key: "hero_message",
        payload: { value: FALLBACK_HERO_MESSAGE },
      },
      {
        key: "presentes_intro",
        payload: { value: FALLBACK_PRESENTES_INTRO },
      },
      {
        key: "grande_dia",
        payload: { paragraphs: FALLBACK_GRANDE_DIA },
      },
      {
        key: "traje",
        payload: { paragraphs: FALLBACK_TRAJE },
      },
      {
        key: "nossa_historia",
        payload: {
          titulo: sobreNosData.titulo,
          subtitulo: sobreNosData.subtitulo,
          assinatura: sobreNosData.assinatura,
          paragraphs: sobreNosData.paragrafos,
        },
      },
    ]);
  }

  const [anyGift] = await db.select({ id: gifts.id }).from(gifts).limit(1);
  if (!anyGift) {
    const rows = presentesData as JsonGift[];
    for (let i = 0; i < rows.length; i += 1) {
      const item = rows[i];
      let mediaId: string | null = null;
      const staticPath = staticJpegPathForGift(item.id);
      if (staticPath && isSafeStaticPath(staticPath)) {
        const file = publicAbs(staticPath);
        const [media] = await db
          .insert(siteMedia)
          .values({
            source: "static",
            staticPath,
            mime: "image/jpeg",
            byteSize: statSync(file).size,
          })
          .returning({ id: siteMedia.id });
        mediaId = media?.id ?? null;
      }
      await db.insert(gifts).values({
        title: item.nome,
        description: item.descricao,
        pix: item.chavePix?.trim() ? item.chavePix.trim() : null,
        suggestedValue: item.valor?.trim() ? item.valor.trim() : null,
        mediaId,
        sortOrder: i,
      });
    }
  }

  const [anyHero] = await db
    .select({ id: sitePhotos.id })
    .from(sitePhotos)
    .where(eq(sitePhotos.collection, "hero"))
    .limit(1);
  if (!anyHero) {
    for (let i = 0; i < HERO_STATIC.length; i += 1) {
      const staticPath = HERO_STATIC[i];
      const file = publicAbs(staticPath);
      if (!existsSync(file) || !isSafeStaticPath(staticPath)) continue;
      const [media] = await db
        .insert(siteMedia)
        .values({
          source: "static",
          staticPath,
          mime: "image/jpeg",
          byteSize: statSync(file).size,
        })
        .returning({ id: siteMedia.id });
      if (!media) continue;
      await db.insert(sitePhotos).values({
        collection: "hero",
        mediaId: media.id,
        sortOrder: i,
      });
    }
  }

  const historiaPaths = Array.isArray(sobreNosData.imagensCarrossel)
    ? sobreNosData.imagensCarrossel
    : [];
  const [anyHistoria] = await db
    .select({ id: sitePhotos.id })
    .from(sitePhotos)
    .where(eq(sitePhotos.collection, "historia"))
    .limit(1);
  if (!anyHistoria && historiaPaths.length > 0) {
    for (let i = 0; i < historiaPaths.length; i += 1) {
      const staticPath = historiaPaths[i];
      if (!isSafeStaticPath(staticPath)) continue;
      const file = publicAbs(staticPath);
      if (!existsSync(file)) continue;
      const [media] = await db
        .insert(siteMedia)
        .values({
          source: "static",
          staticPath,
          mime: "image/jpeg",
          byteSize: statSync(file).size,
        })
        .returning({ id: siteMedia.id });
      if (!media) continue;
      await db.insert(sitePhotos).values({
        collection: "historia",
        mediaId: media.id,
        sortOrder: i,
      });
    }
  }

  await db.insert(contentSeed).values({ id: "v1" }).onConflictDoNothing();
}
