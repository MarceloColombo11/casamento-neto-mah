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

export function GiftModal({ presente, open, onOpenChange }: GiftModalProps) {
  const [copied, setCopied] = useState(false);
  const [chavePix, setChavePix] = useState<string | null>(null);
  const [loadingPix, setLoadingPix] = useState(false);
  const [errorPix, setErrorPix] = useState(false);

  useEffect(() => {
    if (!presente?.id || !open) {
      setChavePix(null);
      setErrorPix(false);
      return;
    }
    setChavePix(null);
    setLoadingPix(true);
    setErrorPix(false);

    fetch(`/api/presentes/${encodeURIComponent(presente.id)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao carregar");
        return res.json();
      })
      .then((data: { chavePix: string }) => {
        setChavePix(data.chavePix ?? null);
      })
      .catch(() => {
        setErrorPix(true);
        toast.error("Erro ao carregar chave Pix. Tente novamente.");
      })
      .finally(() => {
        setLoadingPix(false);
      });
  }, [presente?.id, open]);

  const handleCopyPix = () => {
    if (!chavePix) return;
    navigator.clipboard.writeText(chavePix);
    setCopied(true);
    toast.success("Chave copiada! Cole no app do seu banco.");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!presente) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading break-words text-brown">
            {presente.nome}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes do presente e pagamento via Pix com QR Code e chave para
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

          <div className="flex flex-col items-center gap-4 rounded-lg border border-olive/20 bg-cream/50 p-4">
            <p className="text-sm font-medium text-brown">Pague via Pix</p>
            {loadingPix ? (
              <div className="flex size-40 items-center justify-center">
                <Loader2 className="size-10 animate-spin text-olive" />
              </div>
            ) : errorPix ? (
              <p className="text-sm text-red-600">
                Não foi possível carregar a chave Pix.
              </p>
            ) : chavePix ? (
              <>
                <QRCodeSVG
                  value={chavePix}
                  size={160}
                  level="M"
                  className="rounded-lg"
                />
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start">
                  <code className="min-w-0 overflow-x-auto whitespace-nowrap rounded bg-white px-3 py-2 text-xs text-olive">
                    {chavePix}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={handleCopyPix}
                    aria-label="Copiar chave Pix"
                  >
                    {copied ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
                <p className="break-words text-xs text-olive">
                  Copie a chave e cole no app do seu banco para pagar via Pix.
                </p>
              </>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
