import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createPendingMediaToken,
  verifySessionToken,
} from "@/lib/admin-session";
import { isDriveUploadConfigured } from "@/lib/drive-auth";
import { createResumableUploadSession } from "@/lib/drive-resumable";
import {
  isAllowedOrigin,
  resolveRequestOrigin,
} from "@/lib/request-origin";
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

  if (!isDriveUploadConfigured()) {
    return NextResponse.json(
      { error: "O envio de fotos ainda não está configurado." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      fileName?: string;
      mimeType?: string;
      size?: number;
      origin?: string;
    };
    const fileName = typeof body.fileName === "string" ? body.fileName : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
    const size = Number(body.size);
    const validation = validateSiteImageFile({ mimeType, size });
    if (!fileName || !validation.ok) {
      return NextResponse.json(
        {
          error: validation.ok
            ? "Envie o nome, o tipo e o tamanho do arquivo."
            : validation.error,
        },
        { status: 400 },
      );
    }

    const origin =
      typeof body.origin === "string" && body.origin
        ? body.origin
        : resolveRequestOrigin(request);
    const driveName = `site-content-${randomUUID()}`;
    const { uploadUrl } = await createResumableUploadSession({
      fileName,
      mimeType,
      size,
      origin,
      driveName,
    });

    return NextResponse.json({
      uploadUrl,
      pendingToken: createPendingMediaToken(driveName),
    });
  } catch (error) {
    console.error("[admin/media/session]", error);
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível iniciar o envio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
