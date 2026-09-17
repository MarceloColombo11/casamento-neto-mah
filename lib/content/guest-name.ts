export const GUEST_NAME_MAX = 120;
export const GUEST_GROUP_LABEL_MAX = 80;

export function normalizePersonName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function validateGuestFullName(
  value: unknown,
):
  | { ok: true; value: string; normalized: string }
  | { ok: false; error: string } {
  const trimmed = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!trimmed) {
    return { ok: false, error: "Preencha o nome completo." };
  }
  if (trimmed.length > GUEST_NAME_MAX) {
    return {
      ok: false,
      error: `O nome pode ter no máximo ${GUEST_NAME_MAX} caracteres.`,
    };
  }
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length < 2) {
    return { ok: false, error: "Informe nome e sobrenome." };
  }
  return {
    ok: true,
    value: trimmed,
    normalized: normalizePersonName(trimmed),
  };
}
