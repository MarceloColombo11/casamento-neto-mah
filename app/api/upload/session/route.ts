import { NextResponse } from "next/server";
import { isDriveUploadConfigured } from "@/lib/drive-auth";
import { createResumableUploadSession } from "@/lib/drive-resumable";
import { validateMediaFile } from "@/lib/media-utils";

function resolveOrigin(request: Request): string {
  const fromHeader = request.headers.get("origin");
  if (fromHeader) return fromHeader;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (siteUrl) return siteUrl;

  const host = request.headers.get("host");
  if (host) {
    const proto = request.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export async function POST(request: Request) {
  if (!isDriveUploadConfigured()) {
    return NextResponse.json(
      { success: false, error: "Upload não configurado" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const fileName =
      typeof body.fileName === "string"
        ? body.fileName
        : typeof body.filename === "string"
          ? body.filename
          : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
    const size = Number(body.size);

    if (!fileName || !mimeType || !Number.isFinite(size)) {
      return NextResponse.json(
        {
          success: false,
          error: "Envie fileName, mimeType e size.",
        },
        { status: 400 }
      );
    }

    const validation = validateMediaFile({ mimeType, size, name: fileName });
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const origin = resolveOrigin(request);
    const { uploadUrl } = await createResumableUploadSession({
      fileName,
      mimeType,
      size,
      origin,
    });

    return NextResponse.json({ success: true, uploadUrl });
  } catch (err) {
    console.error("[upload/session]", err);
    const message =
      err instanceof Error ? err.message : "Erro ao iniciar o upload.";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
