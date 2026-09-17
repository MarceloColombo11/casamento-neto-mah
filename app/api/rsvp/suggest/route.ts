import { NextRequest, NextResponse } from "next/server";
import { getClientIp, isAllowedOrigin } from "@/lib/request-origin";
import { isRsvpRateLimited } from "@/lib/rsvp-rate-limit";
import { suggestGuests } from "@/lib/content/guests";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ guests: [] }, { status: 403 });
  }
  if (isRsvpRateLimited(getClientIp(request), "suggest")) {
    return NextResponse.json({ guests: [] }, { status: 429 });
  }
  const q = request.nextUrl.searchParams.get("q") ?? "";
  try {
    const guests = await suggestGuests(q);
    return NextResponse.json(
      { guests },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("[rsvp]");
    return NextResponse.json({ guests: [] }, { status: 503 });
  }
}
