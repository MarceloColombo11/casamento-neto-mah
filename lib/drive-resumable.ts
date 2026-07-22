import {
  getDriveAccessToken,
  getDriveAuthMode,
  getDriveFolderId,
  isDriveUploadConfigured,
} from "@/lib/drive-auth";
import { buildDriveFileName } from "@/lib/media-utils";

export type CreateResumableSessionInput = {
  fileName: string;
  mimeType: string;
  size: number;
  /** Origin do browser — obrigatório para CORS no PUT direto ao Drive */
  origin: string;
};

function mapDriveError(status: number, bodyPreview: string): string {
  if (bodyPreview.includes("storageQuotaExceeded") || bodyPreview.includes("storage quota")) {
    return (
      "A Service Account não tem cota no Drive pessoal. " +
      "Configure OAuth (GOOGLE_OAUTH_*) da conta dona da pasta — veja o README."
    );
  }

  if (status === 403 || status === 404) {
    return getDriveAuthMode() === "oauth"
      ? "Sem acesso à pasta do Drive. Confira GOOGLE_DRIVE_FOLDER_ID e o refresh token."
      : "Sem acesso à pasta do Drive. Use OAuth ou uma Shared Drive com a Service Account.";
  }

  return "Não foi possível iniciar o upload. Tente novamente.";
}

/**
 * Inicia upload resumível no Drive API v3.
 * Retorna a URL (header Location) para o cliente enviar os bytes.
 */
export async function createResumableUploadSession(
  input: CreateResumableSessionInput
): Promise<{ uploadUrl: string }> {
  if (!isDriveUploadConfigured()) {
    throw new Error("Drive upload não configurado");
  }

  const folderId = getDriveFolderId();
  if (!folderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID não configurado");
  }

  const accessToken = await getDriveAccessToken();
  const driveName = buildDriveFileName(input.fileName);

  const initUrl =
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true";

  const response = await fetch(initUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": input.mimeType,
      "X-Upload-Content-Length": String(input.size),
      Origin: input.origin,
    },
    body: JSON.stringify({
      name: driveName,
      parents: [folderId],
    }),
  });

  if (!response.ok) {
    const bodyPreview = (await response.text()).slice(0, 400);
    console.error("[drive-resumable]", {
      status: response.status,
      authMode: getDriveAuthMode(),
      bodyPreview,
    });
    throw new Error(mapDriveError(response.status, bodyPreview));
  }

  const uploadUrl = response.headers.get("Location");
  if (!uploadUrl) {
    throw new Error("Resposta inválida do Google Drive (sem Location).");
  }

  return { uploadUrl };
}
