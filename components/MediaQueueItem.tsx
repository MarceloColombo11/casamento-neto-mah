"use client";

import { Film, Loader2, RefreshCw, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/media-utils";
import type { QueueItem } from "@/hooks/useMediaUploadQueue";

type MediaQueueItemProps = {
  item: QueueItem;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
};

function statusLabel(item: QueueItem): string {
  switch (item.status) {
    case "queued":
      return "Aguardando...";
    case "compressing":
      return "Preparando...";
    case "uploading":
      return `Enviando ${item.progress}%`;
    case "success":
      return "Enviado";
    case "error":
      return item.error || "Erro";
    default:
      return "";
  }
}

export function MediaQueueItem({
  item,
  onRetry,
  onRemove,
}: MediaQueueItemProps) {
  const busy =
    item.status === "queued" ||
    item.status === "compressing" ||
    item.status === "uploading";

  return (
    <div className="flex gap-3 rounded-xl border border-olive/15 bg-white p-3">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-olive/5">
        {item.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.previewUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-olive/50">
            <Film className="size-7" aria-hidden />
          </div>
        )}
        {item.status === "success" && (
          <div className="absolute inset-0 flex items-center justify-center bg-sage/80">
            <Check className="size-6 text-white" aria-hidden />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-brown" title={item.file.name}>
              {item.file.name}
            </p>
            <p className="text-xs text-olive/70">
              {formatFileSize(item.file.size)}
            </p>
          </div>
          {!busy && item.status !== "success" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-full"
              onClick={() => onRemove(item.id)}
              aria-label="Remover da fila"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-olive">
          {busy && <Loader2 className="size-3.5 animate-spin shrink-0" aria-hidden />}
          <span className="truncate">{statusLabel(item)}</span>
        </div>

        {(item.status === "uploading" || item.status === "compressing") && (
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-olive/10"
            role="progressbar"
            aria-valuenow={item.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-sage transition-[width] duration-200"
              style={{
                width: `${item.status === "compressing" ? 8 : item.progress}%`,
              }}
            />
          </div>
        )}

        {item.status === "error" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-1 h-8"
            onClick={() => onRetry(item.id)}
          >
            <RefreshCw className="mr-1.5 size-3.5" aria-hidden />
            Tentar de novo
          </Button>
        )}
      </div>
    </div>
  );
}
