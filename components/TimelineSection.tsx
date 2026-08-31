"use client";

import { Timeline } from "./Timeline";
import type { TimelineEvent } from "./Timeline";

interface TimelineSectionProps {
  events: TimelineEvent[];
}

export function TimelineSection({ events }: TimelineSectionProps) {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 text-center">
        <h2 className="font-heading text-3xl font-semibold text-navy md:text-4xl">
          Como será o grande dia?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-navy/70 sm:text-base">
          Programação do dia do casamento — horários e momentos. Em breve
          atualizaremos com a versão final.
        </p>
      </div>

      <Timeline events={events} />
    </div>
  );
}
