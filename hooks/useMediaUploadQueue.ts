"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-utils";
import {
  guessMimeFromFileName,
  isImageMime,
  validateMediaFileFromFile,
} from "@/lib/media-utils";
import { MAX_AUTO_RETRIES, resumablePut } from "@/lib/resumable-put";

const SESSION_ENDPOINT = "/api/upload/session";
const CONCURRENCY = 2;

export type QueueItemStatus =
  | "queued"
  | "compressing"
  | "uploading"
  | "success"
  | "error";

export type QueueItem = {
  id: string;
  file: File;
  previewUrl: string | null;
  status: QueueItemStatus;
  progress: number;
  error?: string;
  uploadUrl?: string;
};

function createItemId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function prepareFile(file: File): Promise<File> {
  if (!isImageMime(file.type) && !file.type.startsWith("image/")) {
    return file;
  }

  // HEIC/HEIF/GIF: canvas pode falhar — envia original
  if (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  try {
    return await compressImage(file);
  } catch {
    return file;
  }
}

function resolveMime(file: File): string {
  return file.type || guessMimeFromFileName(file.name) || "application/octet-stream";
}

async function requestUploadSession(file: File): Promise<string> {
  const response = await fetch(SESSION_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: resolveMime(file),
      size: file.size,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (response.status === 503) {
    throw new Error("NOT_CONFIGURED");
  }

  if (!response.ok || !result?.uploadUrl) {
    throw new Error(
      typeof result?.error === "string"
        ? result.error
        : "Não foi possível iniciar o envio."
    );
  }

  return result.uploadUrl as string;
}

export function useMediaUploadQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const itemsRef = useRef<QueueItem[]>([]);
  const inFlightRef = useRef(new Set<string>());
  const activeCountRef = useRef(0);
  const batchTotalsRef = useRef({ success: 0, failed: 0, pending: 0 });
  const pumpScheduledRef = useRef(false);

  const syncItems = useCallback((next: QueueItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const patchItem = useCallback((id: string, patch: Partial<QueueItem>) => {
    const next = itemsRef.current.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    itemsRef.current = next;
    setItems(next);
  }, []);

  const finishBatchIfDone = useCallback(() => {
    const { success, failed, pending } = batchTotalsRef.current;
    if (pending > 0) return;
    if (success + failed === 0) return;

    if (failed === 0) {
      toast.success(
        success === 1
          ? "1 arquivo enviado! Obrigado por compartilhar."
          : `${success} arquivos enviados! Obrigado por compartilhar.`
      );
    } else if (success === 0) {
      toast.error(
        failed === 1
          ? "1 arquivo falhou. Toque em tentar de novo."
          : `${failed} arquivos falharam. Toque em tentar de novo.`
      );
    } else {
      toast.message(
        `${success} enviados, ${failed} falhou${failed > 1 ? "ram" : ""}.`
      );
    }

    batchTotalsRef.current = { success: 0, failed: 0, pending: 0 };
  }, []);

  const pump = useCallback(() => {
    if (pumpScheduledRef.current) return;
    pumpScheduledRef.current = true;

    queueMicrotask(() => {
      pumpScheduledRef.current = false;

      while (activeCountRef.current < CONCURRENCY) {
        const next = itemsRef.current.find(
          (i) => i.status === "queued" && !inFlightRef.current.has(i.id)
        );
        if (!next) break;

        inFlightRef.current.add(next.id);
        activeCountRef.current += 1;
        patchItem(next.id, {
          status: "compressing",
          progress: 0,
          error: undefined,
        });

        const itemId = next.id;
        const originalFile = next.file;

        void (async () => {
          try {
            patchItem(itemId, { status: "compressing" });
            const prepared = await prepareFile(originalFile);

            let uploadUrl = itemsRef.current.find((i) => i.id === itemId)
              ?.uploadUrl;

            if (!uploadUrl) {
              uploadUrl = await requestUploadSession(prepared);
            }

            patchItem(itemId, {
              file: prepared,
              uploadUrl,
              status: "uploading",
            });

            await resumablePut({
              uploadUrl,
              file: prepared,
              maxRetries: MAX_AUTO_RETRIES,
              onProgress: ({ percent }) => {
                patchItem(itemId, { progress: percent, status: "uploading" });
              },
            });

            patchItem(itemId, {
              status: "success",
              progress: 100,
              error: undefined,
            });
            batchTotalsRef.current.success += 1;
          } catch (err) {
            const message =
              err instanceof Error && err.message === "NOT_CONFIGURED"
                ? "Envio de fotos em breve. Volte em alguns dias!"
                : err instanceof Error
                  ? err.message
                  : "Erro ao enviar. Tente novamente.";

            patchItem(itemId, { status: "error", error: message });
            batchTotalsRef.current.failed += 1;
          } finally {
            batchTotalsRef.current.pending = Math.max(
              0,
              batchTotalsRef.current.pending - 1
            );
            inFlightRef.current.delete(itemId);
            activeCountRef.current = Math.max(0, activeCountRef.current - 1);
            finishBatchIfDone();
            pump();
          }
        })();
      }
    });
  }, [finishBatchIfDone, patchItem]);

  const enqueueFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      const accepted: QueueItem[] = [];
      const rejectedMessages: string[] = [];

      for (const file of list) {
        const validation = validateMediaFileFromFile(file);
        if (!validation.valid) {
          rejectedMessages.push(`${file.name}: ${validation.error}`);
          continue;
        }

        const mime = file.type || guessMimeFromFileName(file.name);
        const isImage = isImageMime(mime) || mime.startsWith("image/");
        // Garante mime no File quando o browser deixa vazio
        const normalized =
          file.type || !mime
            ? file
            : new File([file], file.name, { type: mime, lastModified: file.lastModified });
        accepted.push({
          id: createItemId(),
          file: normalized,
          previewUrl: isImage ? URL.createObjectURL(normalized) : null,
          status: "queued",
          progress: 0,
        });
      }

      if (rejectedMessages.length > 0) {
        toast.error(
          rejectedMessages.length === 1
            ? rejectedMessages[0]
            : `${rejectedMessages.length} arquivos rejeitados (formato ou > 200 MB).`
        );
      }

      if (accepted.length === 0) return;

      batchTotalsRef.current.pending += accepted.length;
      const next = [...itemsRef.current, ...accepted];
      syncItems(next);
      pump();
    },
    [pump, syncItems]
  );

  const retryItem = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((i) => i.id === id);
      if (!item || item.status !== "error") return;

      batchTotalsRef.current.pending += 1;
      patchItem(id, {
        status: "queued",
        progress: 0,
        error: undefined,
        uploadUrl: undefined,
      });
      pump();
    },
    [patchItem, pump]
  );

  const removeItem = useCallback(
    (id: string) => {
      const target = itemsRef.current.find((i) => i.id === id);
      if (!target) return;
      if (
        target.status === "compressing" ||
        target.status === "uploading" ||
        target.status === "queued"
      ) {
        return;
      }
      if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
      syncItems(itemsRef.current.filter((i) => i.id !== id));
    },
    [syncItems]
  );

  const isUploading = items.some(
    (i) =>
      i.status === "queued" ||
      i.status === "compressing" ||
      i.status === "uploading"
  );

  return {
    items,
    enqueueFiles,
    retryItem,
    removeItem,
    isUploading,
  };
}
