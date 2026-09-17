import { NextResponse } from "next/server";
import { getClientIp, isAllowedOrigin } from "@/lib/request-origin";
import { isRsvpRateLimited } from "@/lib/rsvp-rate-limit";
import { applyPublicRsvp } from "@/lib/content/guests";
import { getDb } from "@/lib/db/client";
import { mirrorRsvpToSheet } from "@/lib/rsvp-sheet-mirror";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRsvpRateLimited(ip)) {
    return NextResponse.json(
      {
        success: false,
        error: "Muitas tentativas. Aguarde um minuto e tente novamente.",
      },
      { status: 429 },
    );
  }

  if (!isAllowedOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Origem não permitida." },
      { status: 403 },
    );
  }

  if (!getDb()) {
    return NextResponse.json(
      { success: false, error: "Tente de novo em instantes." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      name?: unknown;
      attending?: unknown;
      guestId?: unknown;
    };

    if (typeof body.attending !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Escolha se você vai ou não vai." },
        { status: 400 },
      );
    }

    const name = typeof body.name === "string" ? body.name : "";
    const guestId = typeof body.guestId === "string" ? body.guestId : null;

    await applyPublicRsvp({
      name,
      attending: body.attending,
      guestId,
    });

    void mirrorRsvpToSheet({ nome: name.trim(), attending: body.attending });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[rsvp]");
    const message =
      error instanceof Error && error.message.startsWith("Informe")
        ? error.message
        : error instanceof Error && error.message.startsWith("Preencha")
          ? error.message
          : error instanceof Error && error.message.includes("máximo")
            ? error.message
            : "Tente de novo em instantes.";
    const status = message === "Tente de novo em instantes." ? 503 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
