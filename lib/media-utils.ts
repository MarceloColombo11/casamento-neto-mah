/**
 * Validação e helpers de mídia (fotos + vídeos) para upload ao Drive.
 */

export const MAX_MEDIA_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/gif",
] as const;

export const ALLOWED_VIDEO_MIMES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
] as const;

export const ALLOWED_MEDIA_MIMES = [
  ...ALLOWED_IMAGE_MIMES,
  ...ALLOWED_VIDEO_MIMES,
] as const;

export type MediaValidationResult =
  | { valid: true }
  | { valid: false; error: string };

const ALLOWED_SET = new Set<string>(ALLOWED_MEDIA_MIMES);

export function isAllowedMime(mimeType: string): boolean {
  return ALLOWED_SET.has(mimeType);
}

export function isImageMime(mimeType: string): boolean {
  return (ALLOWED_IMAGE_MIMES as readonly string[]).includes(mimeType);
}

export function isVideoMime(mimeType: string): boolean {
  return (ALLOWED_VIDEO_MIMES as readonly string[]).includes(mimeType);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Valida mime (allowlist) e tamanho ≤ 200 MB.
 * Aceita File no cliente ou campos soltos na API.
 */
export function validateMediaFile(input: {
  mimeType: string;
  size: number;
  name?: string;
}): MediaValidationResult {
  const mime = (input.mimeType || "").toLowerCase().trim();

  if (!mime || !isAllowedMime(mime)) {
    return {
      valid: false,
      error:
        "Formato não suportado. Envie fotos (JPEG, PNG, WebP, HEIC, GIF) ou vídeos (MP4, MOV, WebM).",
    };
  }

  if (!Number.isFinite(input.size) || input.size <= 0) {
    return { valid: false, error: "Arquivo inválido." };
  }

  if (input.size > MAX_MEDIA_SIZE_BYTES) {
    return {
      valid: false,
      error: `Arquivo muito grande. O máximo é ${MAX_MEDIA_SIZE_BYTES / 1024 / 1024} MB.`,
    };
  }

  return { valid: true };
}

/** Fallback quando o browser não preenche file.type (comum em alguns mobiles). */
export function guessMimeFromFileName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
    gif: "image/gif",
    mp4: "video/mp4",
    m4v: "video/x-m4v",
    mov: "video/quicktime",
    webm: "video/webm",
  };
  return map[ext] ?? "";
}

export function validateMediaFileFromFile(file: File): MediaValidationResult {
  const mimeType = file.type || guessMimeFromFileName(file.name);
  return validateMediaFile({
    mimeType,
    size: file.size,
    name: file.name,
  });
}

/** Sanitiza nome de arquivo para uso no Drive. */
export function sanitizeFileName(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, "-").trim() || "arquivo";
  return base.slice(0, 120);
}

/**
 * Nome no Drive: YYYYMMDD-HHmmss-<nome-sanitizado>
 */
export function buildDriveFileName(originalName: string, date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");

  return `${stamp}-${sanitizeFileName(originalName)}`;
}
