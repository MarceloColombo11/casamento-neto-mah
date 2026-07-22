"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface Presente {
  id: string;
  nome: string;
  descricao: string;
  valor?: string;
  chavePix?: string;
  imagem?: string | null;
}

interface GiftCardProps {
  presente: Presente;
  onClick: () => void;
  className?: string;
}

const getImagemUrl = (id: string) => `/imagensPresentes/${id}.jpeg`;

export function GiftCard({ presente, onClick, className }: GiftCardProps) {
  const imagemUrl = getImagemUrl(presente.id);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-[140px] flex-col items-center justify-center gap-4 rounded-xl border border-olive/20 bg-white p-6 shadow-sm transition-all hover:border-sage/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sage/50 focus:ring-offset-2 active:scale-[0.99] overflow-hidden lg:hover:scale-[1.02]",
        className
      )}
      aria-label={`Ver detalhes do presente: ${presente.nome}`}
    >
      <div className="relative size-16 min-w-[4rem] min-h-[4rem] overflow-hidden rounded-full bg-sage/20 transition-colors group-hover:bg-sage/30">
        <Image
          src={imagemUrl}
          alt={presente.nome}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div className="text-center">
        <h3 className="font-heading text-lg font-semibold text-brown">
          {presente.nome}
        </h3>
        {presente.valor && (
          <p className="mt-1 text-sm text-olive">{presente.valor}</p>
        )}
      </div>
    </button>
  );
}
