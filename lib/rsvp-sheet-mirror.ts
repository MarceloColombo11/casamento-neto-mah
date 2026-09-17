const RSVP_URL = process.env.GOOGLE_APPS_SCRIPT_RSVP_URL ?? "";
const RSVP_TIMEOUT_MS = 30_000;

export async function mirrorRsvpToSheet(payload: {
  nome: string;
  attending: boolean;
}): Promise<void> {
  if (!RSVP_URL) return;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RSVP_TIMEOUT_MS);
  try {
    await fetch(RSVP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal,
    });
  } catch {
    console.error("[rsvp] mirror");
  } finally {
    clearTimeout(timeoutId);
  }
}
