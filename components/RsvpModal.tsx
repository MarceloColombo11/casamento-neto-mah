"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Heart, PartyPopper } from "lucide-react";
import { fireConfettiCannon } from "@/lib/confetti";

const RSVP_ENDPOINT = "/api/rsvp";

interface RsvpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RsvpModal({ open, onOpenChange }: RsvpModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    nomeAcompanhante: "",
    microonibus: "" as "" | "sim" | "nao",
  });
  const [nomeError, setNomeError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSuccess(false);
      setNomeError(null);
      setEmailError(null);
      const t = setTimeout(() => firstInputRef.current?.focus({ preventScroll: true }), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (success) fireConfettiCannon();
  }, [success]);

  const validateNome = (nome: string) => {
    const trimmed = nome.trim();
    if (!trimmed) return "Por favor, informe seu nome completo.";
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return "Por favor, informe nome e sobrenome.";
    return null;
  };

  const validateEmail = (email: string) => {
    if (!email.trim()) return null;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return "Informe um e-mail válido.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nErr = validateNome(formData.nome);
    const eErr = validateEmail(formData.email);
    setNomeError(nErr);
    setEmailError(eErr);

    if (nErr || eErr) {
      if (nErr) toast.error(nErr);
      else if (eErr) toast.error(eErr);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(RSVP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome.trim(),
          email: formData.email.trim() || null,
          nomeAcompanhante: formData.nomeAcompanhante.trim() || null,
          microonibus: formData.microonibus || null,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (response.ok && result?.success !== false) {
        setSuccess(true);
        setFormData({ nome: "", email: "", nomeAcompanhante: "", microonibus: "" });
      } else {
        toast.error(result?.error ?? "Erro ao confirmar. Tente novamente.");
      }
    } catch {
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (success) setSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-[90dvh] max-w-md overflow-y-auto pb-safe sm:max-w-md"
        aria-describedby={success ? "rsvp-success-desc" : "rsvp-form-desc"}
        aria-busy={loading}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-brown">
            {success ? "Presença confirmada!" : "Confirmar Presença"}
          </DialogTitle>
          <DialogDescription id={success ? "rsvp-success-desc" : "rsvp-form-desc"}>
            {success
              ? "Obrigado por nos honrar com sua presença neste dia tão especial!"
              : "Preencha o formulário para confirmar sua presença no nosso casamento."}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-6 py-4 animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="flex size-20 items-center justify-center rounded-full bg-sage/20 text-sage">
              <Heart className="size-10 fill-sage" aria-hidden />
            </div>
            <p className="text-center font-heading text-lg text-brown">
              Mal podemos esperar para celebrar com você!
            </p>
            <div className="flex items-center gap-2 text-olive">
              <PartyPopper className="size-5" aria-hidden />
              <span className="text-sm">Nos vemos em breve</span>
            </div>
            <Button
              size="lg"
              className="min-h-[44px] w-full min-w-[44px] rounded-xl bg-sage px-6 transition-transform active:scale-[0.98] hover:bg-sage/90"
              onClick={handleClose}
            >
              Fechar
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 pb-2"
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor="rsvp-nome">Nome completo *</Label>
              <Input
                ref={firstInputRef}
                id="rsvp-nome"
                value={formData.nome}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, nome: e.target.value }));
                  if (nomeError) setNomeError(null);
                }}
                placeholder="Seu nome completo"
                required
                disabled={loading}
                className="min-h-[44px]"
                aria-describedby={nomeError ? "rsvp-nome-error" : undefined}
                aria-invalid={!!nomeError}
              />
              {nomeError && (
                <p id="rsvp-nome-error" className="text-sm text-destructive" role="alert">
                  {nomeError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rsvp-email">E-mail</Label>
              <Input
                id="rsvp-email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData((p) => ({ ...p, email: e.target.value }));
                  if (emailError) setEmailError(null);
                }}
                placeholder="seu@email.com"
                disabled={loading}
                className="min-h-[44px]"
                aria-describedby={emailError ? "rsvp-email-error" : undefined}
                aria-invalid={!!emailError}
              />
              {emailError && (
                <p id="rsvp-email-error" className="text-sm text-destructive" role="alert">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rsvp-nome-acompanhante">Nome do acompanhante</Label>
              <Input
                id="rsvp-nome-acompanhante"
                value={formData.nomeAcompanhante}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, nomeAcompanhante: e.target.value }))
                }
                placeholder="Nome completo do acompanhante (opcional)"
                disabled={loading}
                className="min-h-[44px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rsvp-microonibus">Deseja microônibus?</Label>
              <Select
                value={formData.microonibus}
                onValueChange={(v) =>
                  setFormData((p) => ({ ...p, microonibus: (v ?? "") as "" | "sim" | "nao" }))
                }
                disabled={loading}
              >
                <SelectTrigger className="min-h-[44px] w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
              <span className="block text-sm text-muted-foreground">
                O microônibus será por conta dos noivos.
              </span>
            </div>

            <Button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-sage py-3 text-base transition-transform active:scale-[0.98] hover:bg-sage/90 disabled:opacity-70"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
                  Confirmando...
                </>
              ) : (
                "Confirmar presença"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
