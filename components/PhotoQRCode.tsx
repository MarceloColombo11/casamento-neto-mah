"use client";

import { useRef, useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const QR_DEFAULT_FILENAME = "qr-code-fotos-casamento.png";

type PhotoQRCodeProps = {
  downloadFilename?: string;
};

function getUploadUrl() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/#fotos`;
}

export function PhotoQRCode({
  downloadFilename = QR_DEFAULT_FILENAME,
}: PhotoQRCodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(getUploadUrl());
  }, []);

  const handleDownload = () => {
    const svg = svgRef.current;
    if (!svg || !url) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const dataUrl = `data:image/svg+xml;base64,${btoa(
      unescape(encodeURIComponent(svgData))
    )}`;
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = downloadFilename;
        link.click();
      }
    };
    img.src = dataUrl;
  };

  if (!url) return null;

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber-200/40 bg-linear-to-b from-white to-cream/50 p-6 shadow-sm">
      <div className="relative flex flex-col items-center gap-2">
        <QRCodeSVG
          ref={svgRef}
          value={url}
          size={200}
          level="M"
          className="rounded-xl border border-amber-200/50 bg-white p-3"
        />
      </div>
      <p className="text-center text-sm font-medium text-brown">
        Escaneie para enviar suas fotos
      </p>
      <Button
        variant="outline"
        onClick={handleDownload}
        className="gap-2"
      >
        <Download className="size-4" />
        Baixar para imprimir
      </Button>
    </div>
  );
}
