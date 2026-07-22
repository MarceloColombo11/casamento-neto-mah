"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RsvpModal } from "./RsvpModal";

export function RsvpSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="font-heading text-3xl font-semibold text-brown md:text-4xl">
        Confirmação de Presença
      </h2>
      <p className="mt-6 text-olive leading-relaxed">
        Seria uma honra contar com sua presença neste dia tão especial. Por
        favor, confirme sua presença até o dia 15 de novembro de 2026.
      </p>
      <Button
        size="lg"
        variant="default"
        className="mt-8"
        onClick={() => setModalOpen(true)}
        aria-label="Abrir formulário de confirmação de presença"
      >
        Confirmar Presença
      </Button>
      <RsvpModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
