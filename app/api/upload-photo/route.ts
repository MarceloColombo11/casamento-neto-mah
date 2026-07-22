import { NextResponse } from "next/server";

/**
 * Legacy endpoint (base64 → Apps Script).
 * Use POST /api/upload/session + resumable PUT to Drive.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Este endpoint foi desativado. Atualize a página e use o novo envio de mídias.",
    },
    { status: 410 }
  );
}
