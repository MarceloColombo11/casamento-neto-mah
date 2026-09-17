import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  readPendingMediaName,
  verifySessionToken,
} from "@/lib/admin-session";
import { getDb } from "@/lib/db/client";
import { siteMedia } from "@/lib/db/schema";
import { findDriveFileByName } from "@/lib/drive-resumable";
import { isAllowedOrigin } from "@/lib/request-origin";
import { publicMediaUrl } from "@/lib/site-media";
import {
  SITE_IMAGE_MIMES,
  validateSiteImageFile,
} from "@/lib/content/validation";

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

  try {
    const body = (await request.json()) as { pendingToken?: string };
    const driveName = readPendingMediaName(
      typeof body.pendingToken === "string" ? body.pendingToken : null,
    );
    if (!driveName) {
      return NextResponse.json(
        { error: "O envio expirou. Tente de novo." },
        { status: 400 },
      );
    }

    const file = await findDriveFileByName(driveName);
    if (!file || file.size <= 0) {
      return NextResponse.json(
        { error: "Upload incompleto. Tente de novo." },
        { status: 409 },
      );
    }

    const mime = (SITE_IMAGE_MIMES as readonly string[]).includes(file.mimeType)
      ? file.mimeType
      : "image/jpeg";
    const validation = validateSiteImageFile({
      mimeType: mime,
      size: file.size,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const db = getDb();
    if (!db) {
      return NextResponse.json(
        { error: "Não foi possível salvar. Tente de novo em instantes." },
        { status: 503 },
      );
    }

    const [row] = await db
      .insert(siteMedia)
      .values({
        source: "drive",
        driveFileId: file.id,
        mime,
        byteSize: file.size,
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
    console.error("[admin/media/complete]", error);
    return NextResponse.json(
      { error: "Não foi possível concluir o envio." },
      { status: 500 },
    );
  }
}
