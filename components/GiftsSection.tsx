"use client";

import { useState } from "react";
import { GiftCard, type Presente } from "./GiftCard";
import { GiftModal } from "./GiftModal";

interface GiftsSectionProps {
  presents: Presente[];
}

export function GiftsSection({ presents }: GiftsSectionProps) {
  const [selectedPresent, setSelectedPresent] = useState<Presente | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelectPresent = (presente: Presente) => {
    setSelectedPresent(presente);
    setModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 text-center">
        <h2 className="font-heading text-3xl font-semibold text-brown md:text-4xl">
          Presentes
        </h2>
        <p className="mt-4 text-olive">
          Se preferir nos presentear, aqui estão algumas sugestões.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {presents.map((presente) => (
          <GiftCard
            key={presente.id}
            presente={presente}
            onClick={() => handleSelectPresent(presente)}
          />
        ))}
      </div>

      <GiftModal
        presente={selectedPresent}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
