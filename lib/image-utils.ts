/**
 * Utilitários para processamento de imagens no cliente.
 * Usa Canvas API nativa - sem dependências externas.
 */

import { isImageMime, validateMediaFileFromFile } from "@/lib/media-utils";

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

export type ImageValidationResult =
  | { valid: true }
  | { valid: false; error: string };

/**
 * @deprecated Prefer validateMediaFileFromFile from media-utils.
 * Mantido para compatibilidade: só imagens, com teto de 200 MB.
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!isImageMime(file.type) && !file.type.startsWith("image/")) {
    return { valid: false, error: "Por favor, selecione apenas arquivos de imagem." };
  }
  return validateMediaFileFromFile(file);
}

/**
 * Comprime e redimensiona a imagem (max 1920px, JPEG quality 0.85).
 * Reduz tempo de upload em redes móveis; não é exigido pelo body da Vercel.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Apenas imagens podem ser comprimidas.");
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas não disponível."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const baseName = file.name.replace(/\.[^.]+$/, "") || "foto";
      const outputFilename = `${baseName}-${Date.now()}.jpg`;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Erro ao comprimir a imagem."));
            return;
          }
          resolve(new File([blob], outputFilename, { type: "image/jpeg" }));
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível carregar a imagem."));
    };

    img.src = url;
  });
}

/**
 * Converte um File para base64 (apenas a parte dos dados, sem o prefixo data:).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
