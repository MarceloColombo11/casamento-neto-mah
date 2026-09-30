"use client";

import { useState } from "react";
import { GiftCard, type Presente } from "./GiftCard";
import { GiftModal } from "./GiftModal";

interface GiftsSectionProps {
  presents: Presente[];
  intro?: string;
}

export function GiftsSection({ presents, intro }: GiftsSectionProps) {
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
          {intro ??
            "Se preferir nos presentear, aqui estão algumas sugestões."}
        </p>
      </div>

      {presents.length === 0 ? (
        <p className="text-center text-olive">
          A lista de presentes está sendo preparada.
        </p>
      ) : (
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8 sm:gap-y-14 md:grid-cols-3 lg:grid-cols-4">
          {presents.map((presente, index) => (
            <GiftCard
              key={presente.id}
              presente={presente}
              index={index}
              onClick={() => handleSelectPresent(presente)}
            />
          ))}
        </div>
      )}

      <GiftModal
        presente={selectedPresent}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
