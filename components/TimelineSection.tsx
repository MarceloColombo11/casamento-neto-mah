"use client";

import { Timeline } from "./Timeline";
import type { TimelineEvent } from "./Timeline";

interface TimelineSectionProps {
  events: TimelineEvent[];
}

export function TimelineSection({ events }: TimelineSectionProps) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 text-center">
        <h2 className="font-heading text-3xl font-semibold text-navy md:text-4xl">
          O Grande Dia
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-navy/80 sm:text-lg">
          Se você chegou até aqui, é porque faz parte da nossa história. Criamos
          este espaço para compartilhar um pouco do que estamos preparando e
          reunir todas as informações para esse grande dia.
        </p>
      </div>

      <div className="mb-10 text-center">
        <h3 className="font-heading text-2xl font-medium text-navy md:text-3xl">
          Como será o grande dia?
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-navy/70 sm:text-base">
          Programação do dia do casamento — horários e momentos. Em breve
          atualizaremos com a versão final.
        </p>
      </div>

      <Timeline events={events} />
    </div>
  );
}
