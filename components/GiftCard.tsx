"use client";

import Image from "next/image";
import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatValor } from "@/lib/format-valor";

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
  index?: number;
  className?: string;
}

const PHOTO_SIZES =
  "(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 280px";

const TILTS = [
  "-rotate-[1.5deg]",
  "rotate-[1deg]",
  "-rotate-[0.5deg]",
  "rotate-[1.75deg]",
  "-rotate-[1deg]",
  "rotate-[0.5deg]",
];

/**
 * As fotos chegam em proporções variadas (1:1, 3:4, 2:3, 4:3) e várias têm
 * texto aplicado nas bordas; por isso a imagem inteira aparece (contain) e a
 * mesma foto, desfocada, preenche o espaço que sobra.
 */
function GiftPhoto({ presente }: { presente: Presente }) {
  const imagemUrl = presente.imagem?.trim() || null;

  if (!imagemUrl) {
    return (
      <span className="flex size-full items-center justify-center bg-mist text-navy/30">
        <Gift className="size-10" aria-hidden />
      </span>
    );
  }

  const unoptimized = imagemUrl.startsWith("/api/site-media/");

  return (
    <>
      <Image
        src={imagemUrl}
        alt=""
        fill
        unoptimized={unoptimized}
        sizes={PHOTO_SIZES}
        className="scale-125 object-cover opacity-60 blur-2xl saturate-125"
      />
      <Image
        src={imagemUrl}
        alt=""
        fill
        unoptimized={unoptimized}
        sizes={PHOTO_SIZES}
        className="object-contain"
      />
    </>
  );
}

export function GiftCard({
  presente,
  onClick,
  index = 0,
  className,
}: GiftCardProps) {
  const valor = formatValor(presente.valor);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver detalhes do presente: ${presente.nome}`}
      className={cn(
        "group block w-full bg-white p-2 pb-4 shadow-[0_1px_2px_rgba(31,42,68,0.08),0_10px_28px_-14px_rgba(31,42,68,0.35)] ring-1 ring-beige/80 transition-transform duration-300 ease-out hover:-translate-y-1 hover:rotate-0 focus-visible:rotate-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-3 sm:pb-5",
        TILTS[index % TILTS.length],
        className
      )}
    >
      <div className="relative aspect-4/5 w-full overflow-hidden bg-mist">
        <GiftPhoto presente={presente} />
      </div>
      <div className="px-1 pt-3 text-center sm:pt-4">
        <h3 className="font-heading text-[0.95rem] leading-snug text-balance text-navy italic sm:text-lg">
          {presente.nome}
        </h3>
        {valor && (
          <p className="mt-1.5 font-heading text-base font-semibold text-gold-deep tabular-nums sm:text-lg">
            {valor}
          </p>
        )}
      </div>
    </button>
  );
}
