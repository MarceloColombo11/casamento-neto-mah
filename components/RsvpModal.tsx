"use client";

import { useEffect, useRef, useState } from "react";
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
import { toast } from "sonner";
import { Loader2, Heart, PartyPopper } from "lucide-react";
import { fireConfettiCannon } from "@/lib/confetti";
import { normalizePersonName } from "@/lib/content/guest-name";

const RSVP_ENDPOINT = "/api/rsvp";

type Suggestion = { id: string; fullName: string };

type RsvpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RsvpModal({ open, onOpenChange }: RsvpModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [nome, setNome] = useState("");
  const [guestId, setGuestId] = useState<string | null>(null);
  const [attending, setAttending] = useState<"" | "sim" | "nao">("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [nomeError, setNomeError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const selectedRef = useRef<Suggestion | null>(null);

  useEffect(() => {
    if (open) {
      setSuccess(false);
      setNomeError(null);
      const t = setTimeout(
        () => firstInputRef.current?.focus({ preventScroll: true }),
        50,
      );
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (success) fireConfettiCannon();
  }, [success]);

  useEffect(() => {
    const selected = selectedRef.current;
    if (selected && nome === selected.fullName) {
      setSuggestions([]);
      return;
    }
    const needle = normalizePersonName(nome);
    if (needle.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const handle = window.setTimeout(() => {
      fetch(`/api/rsvp/suggest?q=${encodeURIComponent(nome)}`, {
        signal: controller.signal,
      })
        .then((response) => response.json() as Promise<{ guests?: Suggestion[] }>)
        .then((data) => setSuggestions(Array.isArray(data.guests) ? data.guests : []))
        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([]);
        });
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [nome]);

  const canSubmit =
    nome.trim().split(/\s+/).filter(Boolean).length >= 2 &&
    (attending === "sim" || attending === "nao");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parts = nome.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      setNomeError("Por favor, informe nome e sobrenome.");
      toast.error("Por favor, informe nome e sobrenome.");
      return;
    }
    if (attending !== "sim" && attending !== "nao") {
      toast.error("Escolha se você vai ou não vai.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(RSVP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nome.trim(),
          attending: attending === "sim",
          guestId,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (response.ok && result?.success !== false) {
        setSuccess(true);
        setNome("");
        selectedRef.current = null;
        setGuestId(null);
        setAttending("");
        setSuggestions([]);
      } else {
        toast.error(result?.error ?? "Erro ao confirmar. Tente novamente.");
      }
    } catch {
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              : "Digite seu nome e diga se você vem. Se o nome não estiver na lista, mesmo assim registramos."}
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
              className="min-h-[44px] w-full min-w-[44px] rounded-xl bg-sage px-6 text-brown transition-transform active:scale-[0.98] hover:bg-gold"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pb-2" noValidate>
            <div className="space-y-2">
              <Label htmlFor="rsvp-nome">Nome completo *</Label>
              <Input
                ref={firstInputRef}
                id="rsvp-nome"
                value={nome}
                onChange={(event) => {
                  const value = event.target.value;
                  setNome(value);
                  const selected = selectedRef.current;
                  if (!selected || value !== selected.fullName) {
                    selectedRef.current = null;
                    setGuestId(null);
                  }
                  if (nomeError) setNomeError(null);
                }}
                placeholder="Seu nome completo"
                required
                disabled={loading}
                className="min-h-[44px]"
                autoComplete="name"
                aria-describedby={nomeError ? "rsvp-nome-error" : undefined}
                aria-invalid={!!nomeError}
                aria-autocomplete="list"
              />
              {suggestions.length > 0 ? (
                <ul className="overflow-hidden rounded-md border border-olive/20 bg-white">
                  {suggestions.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="min-h-11 w-full px-3 py-2 text-left text-sm text-navy hover:bg-cream"
                        onClick={() => {
                          selectedRef.current = item;
                          setNome(item.fullName);
                          setGuestId(item.id);
                          setSuggestions([]);
                        }}
                      >
                        {item.fullName}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {nomeError ? (
                <p id="rsvp-nome-error" className="text-sm text-destructive" role="alert">
                  {nomeError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Você vem? *</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  aria-pressed={attending === "sim"}
                  className={`min-h-11 ${
                    attending === "sim"
                      ? "border-gold bg-gold/20 text-navy"
                      : "text-navy"
                  }`}
                  disabled={loading}
                  onClick={() => setAttending("sim")}
                >
                  Vou
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  aria-pressed={attending === "nao"}
                  className={`min-h-11 ${
                    attending === "nao"
                      ? "border-gold bg-gold/20 text-navy"
                      : "text-navy"
                  }`}
                  disabled={loading}
                  onClick={() => setAttending("nao")}
                >
                  Não vou
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-sage py-3 text-base text-brown transition-transform active:scale-[0.98] hover:bg-gold disabled:opacity-70"
              disabled={loading || !canSubmit}
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
