"use client";

import { useCallback, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoUploadZone } from "@/components/PhotoUploadZone";
import { PhotoQRCode } from "@/components/PhotoQRCode";
import { CameraModal } from "@/components/CameraModal";
import { MediaQueueItem } from "@/components/MediaQueueItem";
import { useMediaUploadQueue } from "@/hooks/useMediaUploadQueue";
import { useCameraCapture } from "@/hooks/useCameraCapture";

export function PhotoUploadSection() {
  const [dragActive, setDragActive] = useState(false);
  const { items, enqueueFiles, retryItem, removeItem, isUploading } =
    useMediaUploadQueue();

  const handleCameraCapture = useCallback(
    (capturedFile: File) => {
      enqueueFiles([capturedFile]);
    },
    [enqueueFiles]
  );

  const camera = useCameraCapture(handleCameraCapture);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const files = e.dataTransfer.files
        ? Array.from(e.dataTransfer.files)
        : [];
      if (files.length > 0) enqueueFiles(files);
    },
    [enqueueFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleCameraOpen = useCallback(async () => {
    await camera.open();
  }, [camera]);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h2 className="font-heading text-3xl font-semibold text-brown md:text-4xl">
          Suba suas fotos e vídeos
        </h2>
        <p className="mt-4 text-olive">
          Compartilhe seus momentos conosco! Envie várias fotos ou vídeos de
          uma vez.
        </p>
      </div>

      <div className="space-y-6" aria-live="polite" aria-busy={isUploading}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="flex flex-1 flex-col gap-6">
            <div className="rounded-2xl border border-amber-200/60 bg-linear-to-b from-white to-cream/80 p-6 shadow-sm">
              <Button
                type="button"
                onClick={handleCameraOpen}
                disabled={camera.isOpen}
                className="h-16 w-full min-h-16 gap-4 rounded-xl bg-sage py-4 text-lg font-medium text-white transition-colors hover:bg-sage/90 disabled:opacity-70"
              >
                <Camera className="size-8" aria-hidden />
                <span>Câmera</span>
                {camera.isOpen && (
                  <Loader2 className="size-6 animate-spin" aria-hidden />
                )}
              </Button>
              <p className="mt-2 text-center text-sm text-olive/80">
                Toque para foto · Segure para vídeo de até 15s
              </p>
            </div>

            <div
              className={`flex flex-col rounded-2xl border-2 border-dashed transition-colors ${
                dragActive
                  ? "border-sage bg-sage/5"
                  : "border-olive/20 bg-white"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <p className="border-b border-olive/10 px-4 py-3 text-sm font-medium text-brown">
                Ou envie da sua galeria
              </p>
              <PhotoUploadZone onFilesSelect={enqueueFiles} />
            </div>

            {items.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-brown">
                  Fila de envio ({items.length})
                </p>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id}>
                      <MediaQueueItem
                        item={item}
                        onRetry={retryItem}
                        onRemove={removeItem}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-col self-center lg:w-72 lg:self-start">
            <PhotoQRCode />
          </div>
        </div>

        <CameraModal
          effectiveFacingMode={camera.effectiveFacingMode}
          open={camera.isOpen}
          isReady={camera.isReady}
          isLoading={camera.isLoading}
          flashEnabled={camera.flashEnabled}
          flashSupported={camera.flashSupported}
          capturedPreview={camera.capturedPreview}
          capturedKind={camera.capturedKind}
          isRecording={camera.isRecording}
          recordProgress={camera.recordProgress}
          maxVideoSeconds={camera.maxVideoSeconds}
          onClose={camera.close}
          onConfirm={camera.confirmCapture}
          onRetake={camera.retake}
          onSwitchFlash={camera.switchFlash}
          onSwitchCamera={camera.switchCamera}
          onShutterPointerDown={camera.onShutterPointerDown}
          onShutterPointerUp={camera.onShutterPointerUp}
          onShutterPointerCancel={camera.onShutterPointerCancel}
          videoRef={camera.setVideoRef}
          onVideoCanPlay={camera.handleVideoCanPlay}
        />
      </div>
    </div>
  );
}
