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
        <h2 className="font-heading text-3xl font-semibold text-brown md:text-4xl">
          Programação
        </h2>
        <p className="mt-4 max-w-xl mx-auto text-pretty text-olive">
          Toque em cada momento para ver os detalhes — Recepção às 16h, cerimônia às 16h30
        </p>
      </div>
      <Timeline events={events} />
    </div>
  );
}
