export const SITE_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_SITE_IMAGE_BYTES = 4 * 1024 * 1024;
export const HERO_PHOTO_LIMIT = 8;
export const HISTORIA_PHOTO_LIMIT = 12;

export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 2000;
export const PIX_MIN = 8;
export const PIX_MAX = 77;
export const VALUE_MAX = 40;
export const SCALAR_TEXT_MAX = 500;
export const PARAGRAPH_MAX = 2000;
export const HISTORIA_FIELD_MAX = 120;

export type PhotoCollection = "hero" | "historia";
export type TextBlockKey =
  | "hero_message"
  | "grande_dia"
  | "traje"
  | "nossa_historia"
  | "presentes_intro";

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function trimRequired(
  value: unknown,
  label: string,
  max: number,
): ValidationResult {
  const trimmed = asString(value).trim();
  if (!trimmed) {
    return { ok: false, error: `Preencha ${label}.` };
  }
  if (trimmed.length > max) {
    return {
      ok: false,
      error: `${label} pode ter no máximo ${max} caracteres.`,
    };
  }
  return { ok: true, value: trimmed };
}

export function trimOptional(
  value: unknown,
  label: string,
  max: number,
): ValidationResult {
  const trimmed = asString(value).trim();
  if (!trimmed) return { ok: true, value: "" };
  if (trimmed.length > max) {
    return {
      ok: false,
      error: `${label} pode ter no máximo ${max} caracteres.`,
    };
  }
  return { ok: true, value: trimmed };
}

export function validatePix(value: unknown): ValidationResult {
  const trimmed = asString(value).trim();
  if (!trimmed) return { ok: true, value: "" };
  if (trimmed.length < PIX_MIN || trimmed.length > PIX_MAX) {
    return {
      ok: false,
      error: `A chave Pix precisa ter entre ${PIX_MIN} e ${PIX_MAX} caracteres, ou ficar vazia.`,
    };
  }
  return { ok: true, value: trimmed };
}

export function validateSiteImageFile(input: {
  mimeType: string;
  size: number;
}): { ok: true } | { ok: false; error: string } {
  const mime = (input.mimeType || "").toLowerCase().trim();
  if (!(SITE_IMAGE_MIMES as readonly string[]).includes(mime)) {
    return {
      ok: false,
      error: "Envie uma foto em JPEG, PNG ou WebP.",
    };
  }
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { ok: false, error: "Arquivo inválido." };
  }
  if (input.size > MAX_SITE_IMAGE_BYTES) {
    return {
      ok: false,
      error: "A foto pode ter no máximo 4 MB.",
    };
  }
  return { ok: true };
}

export function photoLimit(collection: PhotoCollection): number {
  return collection === "hero" ? HERO_PHOTO_LIMIT : HISTORIA_PHOTO_LIMIT;
}

export function photoLimitMessage(collection: PhotoCollection): string {
  return collection === "hero"
    ? "A capa aceita no máximo 8 fotos. Remova uma para enviar outra."
    : "Nossa História aceita no máximo 12 fotos. Remova uma para enviar outra.";
}

export function isTextBlockKey(value: string): value is TextBlockKey {
  return (
    value === "hero_message" ||
    value === "grande_dia" ||
    value === "traje" ||
    value === "nossa_historia" ||
    value === "presentes_intro"
  );
}

export function validateParagraphs(
  values: unknown[],
  label: string,
): { ok: true; value: string[] } | { ok: false; error: string } {
  const paragraphs = values
    .map((item) => asString(item).trim())
    .filter((item) => item.length > 0);

  if (paragraphs.length === 0) {
    return {
      ok: false,
      error: `${label} precisa de pelo menos um parágrafo.`,
    };
  }

  for (const paragraph of paragraphs) {
    if (paragraph.length > PARAGRAPH_MAX) {
      return {
        ok: false,
        error: `Cada parágrafo de ${label} pode ter no máximo ${PARAGRAPH_MAX} caracteres.`,
      };
    }
  }

  return { ok: true, value: paragraphs };
}

export function isSafeStaticPath(path: string): boolean {
  if (!path.startsWith("/") || path.includes("..") || path.includes("\\")) {
    return false;
  }
  return (
    path.startsWith("/images/") || path.startsWith("/imagensPresentes/")
  );
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
