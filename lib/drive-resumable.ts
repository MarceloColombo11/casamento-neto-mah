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
  /** Nome exato no Drive. Se omitido, usa o padrão do álbum de convidados. */
  driveName?: string;
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
  const driveName = input.driveName ?? buildDriveFileName(input.fileName);

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

export type DriveFileMeta = {
  id: string;
  mimeType: string;
  size: number;
};

export async function findDriveFileByName(
  name: string,
  attempts = 4,
): Promise<DriveFileMeta | null> {
  const accessToken = await getDriveAccessToken();
  const q = `name='${name.replace(/'/g, "\\'")}' and trashed=false`;
  const url =
    "https://www.googleapis.com/drive/v3/files?" +
    new URLSearchParams({
      q,
      fields: "files(id,mimeType,size)",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      pageSize: "1",
    }).toString();

  for (let i = 0; i < attempts; i += 1) {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      console.error("[drive-find]", { status: response.status });
      return null;
    }
    const body = (await response.json()) as {
      files?: { id?: string; mimeType?: string; size?: string }[];
    };
    const file = body.files?.[0];
    if (file?.id) {
      return {
        id: file.id,
        mimeType: file.mimeType || "application/octet-stream",
        size: Number(file.size ?? 0),
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1)));
  }

  return null;
}

export async function downloadDriveFile(
  fileId: string,
): Promise<{ bytes: ArrayBuffer; ok: boolean; status: number }> {
  const accessToken = await getDriveAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) {
    return { bytes: new ArrayBuffer(0), ok: false, status: response.status };
  }
  return { bytes: await response.arrayBuffer(), ok: true, status: 200 };
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const accessToken = await getDriveAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok && response.status !== 404) {
    console.error("[drive-delete]", { status: response.status });
  }
}
