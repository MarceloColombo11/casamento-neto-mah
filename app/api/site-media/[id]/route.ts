import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { siteMedia } from "@/lib/db/schema";
import { downloadDriveFile } from "@/lib/drive-resumable";
import { isSafeStaticPath, isUuid } from "@/lib/content/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const db = getDb();
    if (!db) {
      return new NextResponse(null, { status: 404 });
    }

    const [row] = await db
      .select()
      .from(siteMedia)
      .where(eq(siteMedia.id, id))
      .limit(1);
    if (!row) {
      return new NextResponse(null, { status: 404 });
    }

    if (row.source === "static" && row.staticPath && isSafeStaticPath(row.staticPath)) {
      const abs = path.join(process.cwd(), "public", row.staticPath.replace(/^\//, ""));
      if (!existsSync(abs)) {
        return new NextResponse(null, { status: 404 });
      }
      return NextResponse.redirect(new URL(row.staticPath, request.url), 302);
    }

    if (row.source === "drive" && row.driveFileId) {
      const file = await downloadDriveFile(row.driveFileId);
      if (!file.ok) {
        const status = file.status >= 500 || file.status === 0 ? 502 : 404;
        return new NextResponse(null, { status });
      }
      return new NextResponse(file.bytes, {
        status: 200,
        headers: {
          "Content-Type": row.mime,
          "Cache-Control": "public, max-age=3600",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return new NextResponse(null, { status: 404 });
  } catch (error) {
    console.error("[site-media]", error);
    return new NextResponse(null, { status: 502 });
  }
}
