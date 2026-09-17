import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  verifySessionToken,
} from "@/lib/admin-session";
import { getDb } from "@/lib/db/client";
import { siteMedia } from "@/lib/db/schema";
import { isAllowedOrigin } from "@/lib/request-origin";
import { publicMediaUrl } from "@/lib/site-media";
import { validateSiteImageFile } from "@/lib/content/validation";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json(
      { error: "Entre de novo para enviar a foto." },
      { status: 401 },
    );
  }

  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { error: "Origem não permitida." },
      { status: 403 },
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Não foi possível salvar. Tente de novo em instantes." },
      { status: 503 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Envie uma foto." },
        { status: 400 },
      );
    }

    const mimeType = file.type || "image/jpeg";
    const validation = validateSiteImageFile({
      mimeType,
      size: file.size,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const [row] = await db
      .insert(siteMedia)
      .values({
        source: "db",
        mime: mimeType,
        byteSize: bytes.length,
        bytes: sql`decode(${bytes.toString("base64")}, 'base64')`,
      })
      .returning({ id: siteMedia.id });

    if (!row) {
      return NextResponse.json(
        { error: "Não foi possível salvar a foto." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      mediaId: row.id,
      publicUrl: publicMediaUrl(row.id),
    });
  } catch (error) {
    console.error("[admin/media/upload]", error);
    return NextResponse.json(
      { error: "Não foi possível salvar a foto." },
      { status: 500 },
    );
  }
}
