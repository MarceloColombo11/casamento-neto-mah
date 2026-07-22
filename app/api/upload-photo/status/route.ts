import { NextResponse } from "next/server";
import { isDriveUploadConfigured } from "@/lib/drive-auth";

/** @deprecated Prefer GET /api/upload/status */
export async function GET() {
  return NextResponse.json({ enabled: isDriveUploadConfigured() });
}
