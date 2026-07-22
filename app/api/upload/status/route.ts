import { NextResponse } from "next/server";
import { isDriveUploadConfigured } from "@/lib/drive-auth";

export async function GET() {
  return NextResponse.json({ enabled: isDriveUploadConfigured() });
}
