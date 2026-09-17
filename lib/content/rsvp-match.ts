import { validateGuestFullName } from "./guest-name.ts";

export type RsvpGuestRef = { id: string; nameNormalized: string };

export type RsvpTarget =
  | { kind: "guest"; id: string }
  | { kind: "unmatched"; typedName: string; nameNormalized: string };

export function resolveRsvpTarget(
  input: { name: string; guestId?: string | null },
  guests: RsvpGuestRef[],
): { ok: true; target: RsvpTarget } | { ok: false; error: string } {
  const parsed = validateGuestFullName(input.name);
  if (!parsed.ok) return parsed;

  const guestId = input.guestId?.trim() || null;
  if (guestId) {
    const selected = guests.find((guest) => guest.id === guestId);
    if (selected && selected.nameNormalized === parsed.normalized) {
      return { ok: true, target: { kind: "guest", id: selected.id } };
    }
  }

  const exact = guests.filter(
    (guest) => guest.nameNormalized === parsed.normalized,
  );
  if (exact.length === 1) {
    return { ok: true, target: { kind: "guest", id: exact[0].id } };
  }

  return {
    ok: true,
    target: {
      kind: "unmatched",
      typedName: parsed.value,
      nameNormalized: parsed.normalized,
    },
  };
}
