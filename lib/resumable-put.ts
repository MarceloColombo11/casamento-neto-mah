/**
 * Upload resumível direto ao Google Drive (browser → Drive).
 * Chunks de ~8 MB com resume via Content-Range / status 308.
 */

export const CHUNK_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_AUTO_RETRIES = 3;

export type ResumablePutProgress = {
  bytesUploaded: number;
  totalBytes: number;
  percent: number;
};

export type ResumablePutOptions = {
  uploadUrl: string;
  file: Blob;
  onProgress?: (progress: ResumablePutProgress) => void;
  signal?: AbortSignal;
  maxRetries?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Consulta quantos bytes já foram aceitos (resume).
 * Drive responde 308 com Range: bytes=0-N
 */
async function queryUploadedBytes(
  uploadUrl: string,
  totalBytes: number,
  signal?: AbortSignal
): Promise<number> {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": "0",
      "Content-Range": `bytes */${totalBytes}`,
    },
    signal,
  });

  if (response.status === 200 || response.status === 201) {
    return totalBytes;
  }

  if (response.status === 308) {
    const range = response.headers.get("Range");
    if (!range) return 0;
    const match = /bytes=0-(\d+)/i.exec(range);
    if (!match) return 0;
    return Number(match[1]) + 1;
  }

  // Sessão nova / ainda sem bytes
  if (response.status === 404 || response.status === 410) {
    throw new Error("Sessão de upload expirada. Tente novamente.");
  }

  return 0;
}

async function putChunk(
  uploadUrl: string,
  chunk: Blob,
  start: number,
  totalBytes: number,
  signal?: AbortSignal
): Promise<{ done: boolean; nextStart: number }> {
  const end = start + chunk.size - 1;
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(chunk.size),
      "Content-Range": `bytes ${start}-${end}/${totalBytes}`,
      "Content-Type": "application/octet-stream",
    },
    body: chunk,
    signal,
  });

  if (response.status === 200 || response.status === 201) {
    return { done: true, nextStart: totalBytes };
  }

  if (response.status === 308) {
    const range = response.headers.get("Range");
    if (range) {
      const match = /bytes=0-(\d+)/i.exec(range);
      if (match) {
        return { done: false, nextStart: Number(match[1]) + 1 };
      }
    }
    return { done: false, nextStart: end + 1 };
  }

  const preview = (await response.text().catch(() => "")).slice(0, 200);
  throw new Error(
    `Falha no upload (${response.status})${preview ? `: ${preview}` : ""}`
  );
}

/**
 * Envia o arquivo em chunks para a uploadUrl resumível do Drive.
 */
export async function resumablePut(
  options: ResumablePutOptions
): Promise<{ fileId?: string }> {
  const {
    uploadUrl,
    file,
    onProgress,
    signal,
    maxRetries = MAX_AUTO_RETRIES,
  } = options;

  const totalBytes = file.size;
  let offset = 0;
  let retries = 0;

  // Tenta retomar se já houver progresso parcial
  try {
    offset = await queryUploadedBytes(uploadUrl, totalBytes, signal);
  } catch {
    offset = 0;
  }

  onProgress?.({
    bytesUploaded: offset,
    totalBytes,
    percent: totalBytes ? Math.round((offset / totalBytes) * 100) : 0,
  });

  while (offset < totalBytes) {
    if (signal?.aborted) {
      throw new DOMException("Upload cancelado", "AbortError");
    }

    const end = Math.min(offset + CHUNK_SIZE_BYTES, totalBytes);
    const chunk = file.slice(offset, end);

    try {
      const result = await putChunk(uploadUrl, chunk, offset, totalBytes, signal);
      offset = result.nextStart;
      retries = 0;

      onProgress?.({
        bytesUploaded: offset,
        totalBytes,
        percent: totalBytes ? Math.round((offset / totalBytes) * 100) : 100,
      });

      if (result.done) {
        return {};
      }
    } catch (err) {
      if (signal?.aborted) throw err;
      retries += 1;
      if (retries > maxRetries) throw err;

      // Resume a partir do último byte confirmado
      try {
        offset = await queryUploadedBytes(uploadUrl, totalBytes, signal);
      } catch {
        // mantém offset atual
      }

      await sleep(500 * retries);
    }
  }

  return {};
}
