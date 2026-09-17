"use client";

import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { Presente } from "./GiftCard";

interface GiftModalProps {
  presente: Presente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function GiftPixPanel({ giftId }: { giftId: string }) {
  const [copied, setCopied] = useState(false);
  const [chavePix, setChavePix] = useState<string | null>(null);
  const [loadingPix, setLoadingPix] = useState(true);
  const [errorPix, setErrorPix] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/presentes/${encodeURIComponent(giftId)}`)
      .then((res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Falha ao carregar");
        return res.json() as Promise<{ chavePix: string }>;
      })
      .then((data) => {
        if (cancelled) return;
        setChavePix(data?.chavePix ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setErrorPix(true);
        toast.error("Erro ao carregar o Pix. Tente novamente.");
      })
      .finally(() => {
        if (!cancelled) setLoadingPix(false);
      });

    return () => {
      cancelled = true;
    };
  }, [giftId]);

  const handleCopyPix = () => {
    if (!chavePix) return;
    navigator.clipboard.writeText(chavePix);
    setCopied(true);
    toast.success("Código Pix copiado! Cole no app do banco.");
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (!loadingPix && !errorPix && !chavePix) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-olive/20 bg-cream/50 p-4">
      <p className="text-sm font-medium text-brown">Pague via Pix</p>
      {loadingPix ? (
        <div className="flex size-40 items-center justify-center">
          <Loader2 className="size-10 animate-spin text-olive" />
        </div>
      ) : errorPix ? (
        <p className="text-sm text-red-600">
          Não foi possível carregar o Pix.
        </p>
      ) : chavePix ? (
        <>
          <QRCodeSVG
            value={chavePix}
            size={176}
            level="M"
            className="rounded-lg"
          />
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start">
            <code className="min-w-0 break-all rounded bg-white px-3 py-2 text-[11px] leading-snug text-olive">
              {chavePix}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 self-end sm:self-start"
              onClick={handleCopyPix}
              aria-label="Copiar código Pix"
            >
              {copied ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
          <p className="break-words text-xs text-olive">
            Escaneie o QR ou copie o código e cole no app do banco.
          </p>
        </>
      ) : null}
    </div>
  );
}

export function GiftModal({ presente, open, onOpenChange }: GiftModalProps) {
  if (!presente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading break-words text-brown">
            {presente.nome}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes do presente e pagamento via Pix com QR Code e código para
            copiar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 overflow-hidden">
          <p className="break-words text-olive/90">{presente.descricao}</p>
          {presente.valor && (
            <p className="break-words text-sm font-medium text-sage">
              {presente.valor}
            </p>
          )}
          {open ? <GiftPixPanel key={presente.id} giftId={presente.id} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
