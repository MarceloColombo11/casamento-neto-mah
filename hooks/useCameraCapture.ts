"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

export type FacingMode = "user" | "environment";
export type CapturedKind = "photo" | "video";

/** Limite estilo story (Instagram/Snap). */
export const MAX_VIDEO_SECONDS = 15;
const HOLD_TO_RECORD_MS = 220;

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

function extensionForMime(mime: string): string {
  if (mime.includes("mp4")) return "mp4";
  return "webm";
}

export function useCameraCapture(onCapture: (file: File) => void) {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFacingMode, setCurrentFacingMode] =
    useState<FacingMode>("environment");
  const [effectiveFacingMode, setEffectiveFacingMode] =
    useState<FacingMode>("environment");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [flashSupported, setFlashSupported] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedKind, setCapturedKind] = useState<CapturedKind>("photo");
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartedAtRef = useRef(0);
  const progressRafRef = useRef<number | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingActiveRef = useRef(false);
  const pointerDownRef = useRef(false);

  const clearRecordTimers = useCallback(() => {
    if (progressRafRef.current != null) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }
    if (maxTimerRef.current != null) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
    if (holdTimerRef.current != null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setFlashEnabled(false);
  }, []);

  const close = useCallback(() => {
    if (recorderRef.current && recordingActiveRef.current) {
      try {
        recorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    clearRecordTimers();
    recordingActiveRef.current = false;
    setIsRecording(false);
    setRecordProgress(0);
    stopStream();
    setIsReady(false);
    setIsLoading(false);
    setIsOpen(false);
    setCapturedPreview(null);
    setCapturedFile(null);
    setCapturedKind("photo");
  }, [clearRecordTimers, stopStream]);

  const checkMultipleCameras = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === "videoinput");
    setHasMultipleCameras(videoDevices.length > 1);
    return videoDevices.length > 1;
  }, []);

  const startStream = useCallback(
    async (facingMode: FacingMode) => {
      // Áudio para gravação de vídeo; se negar, segue só com vídeo
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
      }

      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const caps = videoTrack.getCapabilities();
        const settingsFacing = videoTrack.getSettings().facingMode;
        const capsFacing = caps.facingMode;
        let effective: FacingMode = facingMode;
        if (settingsFacing === "user" || settingsFacing === "environment") {
          effective = settingsFacing;
        } else if (
          Array.isArray(capsFacing) &&
          capsFacing.length === 1 &&
          (capsFacing[0] === "user" || capsFacing[0] === "environment")
        ) {
          effective = capsFacing[0];
        }
        setEffectiveFacingMode(effective);

        const torchSupported =
          "torch" in caps &&
          typeof (caps as { torch?: boolean }).torch === "boolean";
        setFlashSupported(torchSupported);
        if (!torchSupported) {
          setFlashEnabled(false);
        }
      }

      await checkMultipleCameras();

      return stream;
    },
    [checkMultipleCameras]
  );

  const open = useCallback(
    async (facingMode: FacingMode = "environment") => {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Câmera não suportada neste navegador.");
        return false;
      }

      setIsLoading(true);
      setIsOpen(true);
      setIsReady(false);
      setCurrentFacingMode(facingMode);
      setCapturedPreview(null);
      setCapturedFile(null);
      setRecordProgress(0);
      setIsRecording(false);

      try {
        await startStream(facingMode);
        setIsLoading(false);
        return true;
      } catch (err) {
        close();
        toast.error(
          err instanceof Error && err.name === "NotAllowedError"
            ? "Permissão de câmera negada."
            : "Não foi possível acessar a câmera. Tente novamente."
        );
        return false;
      }
    },
    [close, startStream]
  );

  const switchCamera = useCallback(async () => {
    if (!streamRef.current || isLoading || recordingActiveRef.current) return;

    const nextMode: FacingMode =
      currentFacingMode === "environment" ? "user" : "environment";

    setIsLoading(true);
    setIsReady(false);
    stopStream();

    try {
      await startStream(nextMode);
      setCurrentFacingMode(nextMode);
      setIsLoading(false);
    } catch {
      toast.error("Não foi possível trocar a câmera.");
      setIsLoading(false);
    }
  }, [currentFacingMode, isLoading, startStream, stopStream]);

  const switchFlash = useCallback(async () => {
    const stream = streamRef.current;
    if (!stream || !flashSupported || recordingActiveRef.current) return;

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const nextState = !flashEnabled;

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: nextState } as MediaTrackConstraintSet],
      });
      setFlashEnabled(nextState);
    } catch {
      setFlashEnabled(false);
    }
  }, [flashEnabled, flashSupported]);

  const closeWithFlashOff = useCallback(() => {
    const stream = streamRef.current;
    if (stream && flashEnabled) {
      const videoTrack = stream.getVideoTracks()[0];
      videoTrack
        ?.applyConstraints({
          advanced: [{ torch: false } as MediaTrackConstraintSet],
        })
        .catch(() => {});
    }
    close();
  }, [close, flashEnabled]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const stream = streamRef.current;

    if (!video || !stream || video.readyState < 2) {
      toast.error("Aguarde a câmera carregar.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      toast.error("Erro ao capturar a foto.");
      return;
    }

    if (effectiveFacingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Erro ao capturar a foto.");
          return;
        }
        const file = new File([blob], `foto-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        const previewUrl = URL.createObjectURL(blob);
        setCapturedKind("photo");
        setCapturedPreview(previewUrl);
        setCapturedFile(file);
      },
      "image/jpeg",
      0.9
    );
  }, [effectiveFacingMode]);

  const finishRecording = useCallback((blob: Blob, mimeType: string) => {
    clearRecordTimers();
    recordingActiveRef.current = false;
    setIsRecording(false);
    setRecordProgress(1);

    if (blob.size < 1000) {
      toast.error("Vídeo muito curto. Segure o botão para gravar.");
      setRecordProgress(0);
      return;
    }

    const ext = extensionForMime(mimeType);
    const file = new File([blob], `video-${Date.now()}.${ext}`, {
      type: mimeType.split(";")[0] || "video/webm",
    });
    const previewUrl = URL.createObjectURL(blob);
    setCapturedKind("video");
    setCapturedPreview(previewUrl);
    setCapturedFile(file);
  }, [clearRecordTimers]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || !recordingActiveRef.current) return;
    if (recorder.state === "recording" || recorder.state === "paused") {
      recorder.stop();
    }
  }, []);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || recordingActiveRef.current) return;

    if (typeof MediaRecorder === "undefined") {
      toast.error("Gravação de vídeo não suportada neste navegador.");
      return;
    }

    const mimeType = pickRecorderMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_500_000 })
        : new MediaRecorder(stream, { videoBitsPerSecond: 2_500_000 });
    } catch {
      toast.error("Não foi possível iniciar a gravação.");
      return;
    }

    chunksRef.current = [];
    recorderRef.current = recorder;
    recordingActiveRef.current = true;
    recordStartedAtRef.current = performance.now();
    setIsRecording(true);
    setRecordProgress(0);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      const type = recorder.mimeType || mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      chunksRef.current = [];
      finishRecording(blob, type);
    };

    recorder.onerror = () => {
      clearRecordTimers();
      recordingActiveRef.current = false;
      setIsRecording(false);
      setRecordProgress(0);
      toast.error("Erro ao gravar o vídeo.");
    };

    try {
      recorder.start(250);
    } catch {
      recordingActiveRef.current = false;
      setIsRecording(false);
      toast.error("Não foi possível iniciar a gravação.");
      return;
    }

    const tick = () => {
      if (!recordingActiveRef.current) return;
      const elapsed =
        (performance.now() - recordStartedAtRef.current) / 1000;
      const progress = Math.min(1, elapsed / MAX_VIDEO_SECONDS);
      setRecordProgress(progress);
      if (progress < 1) {
        progressRafRef.current = requestAnimationFrame(tick);
      }
    };
    progressRafRef.current = requestAnimationFrame(tick);

    maxTimerRef.current = setTimeout(() => {
      stopRecording();
    }, MAX_VIDEO_SECONDS * 1000);
  }, [clearRecordTimers, finishRecording, stopRecording]);

  const onShutterPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (!isReady || isLoading || capturedPreview) return;
      pointerDownRef.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);

      holdTimerRef.current = setTimeout(() => {
        if (!pointerDownRef.current) return;
        startRecording();
      }, HOLD_TO_RECORD_MS);
    },
    [capturedPreview, isLoading, isReady, startRecording]
  );

  const onShutterPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      pointerDownRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }

      if (holdTimerRef.current != null) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      if (recordingActiveRef.current) {
        stopRecording();
        return;
      }

      // Toque curto → foto
      if (isReady && !isLoading && !capturedPreview) {
        capturePhoto();
      }
    },
    [capturePhoto, capturedPreview, isLoading, isReady, stopRecording]
  );

  const onShutterPointerCancel = useCallback(() => {
    pointerDownRef.current = false;
    if (holdTimerRef.current != null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (recordingActiveRef.current) {
      stopRecording();
    }
  }, [stopRecording]);

  const confirmCapture = useCallback(() => {
    if (capturedFile) {
      if (capturedPreview) URL.revokeObjectURL(capturedPreview);
      onCapture(capturedFile);
      setCapturedPreview(null);
      setCapturedFile(null);
      setCapturedKind("photo");
      setRecordProgress(0);
      closeWithFlashOff();
    }
  }, [capturedFile, capturedPreview, onCapture, closeWithFlashOff]);

  const retake = useCallback(() => {
    if (capturedPreview) URL.revokeObjectURL(capturedPreview);
    setCapturedPreview(null);
    setCapturedFile(null);
    setCapturedKind("photo");
    setRecordProgress(0);
  }, [capturedPreview]);

  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
  }, []);

  const handleVideoCanPlay = useCallback(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    return () => {
      clearRecordTimers();
      stopStream();
    };
  }, [clearRecordTimers, stopStream]);

  useEffect(() => {
    if (isOpen && !isLoading && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isOpen, isLoading]);

  return {
    isOpen,
    isReady,
    isLoading,
    currentFacingMode,
    effectiveFacingMode,
    flashEnabled,
    flashSupported,
    hasMultipleCameras,
    capturedPreview,
    capturedKind,
    capturedFile,
    isRecording,
    recordProgress,
    maxVideoSeconds: MAX_VIDEO_SECONDS,
    open,
    close: closeWithFlashOff,
    /** @deprecated use onShutter* — mantido para compat */
    capture: capturePhoto,
    confirmCapture,
    retake,
    switchCamera,
    switchFlash,
    setVideoRef,
    handleVideoCanPlay,
    onShutterPointerDown,
    onShutterPointerUp,
    onShutterPointerCancel,
    streamRef,
  };
}
