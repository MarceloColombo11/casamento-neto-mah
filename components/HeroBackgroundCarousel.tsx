"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/** Duração total do ciclo (todas as fotos). Quanto maior, mais lento/suave. */
const LOOP_DURATION_S = 64;

type HeroBackgroundCarouselProps = {
  images: string[];
};

export function HeroBackgroundCarousel({ images }: HeroBackgroundCarouselProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    const immediate = window.setTimeout(update, 0);
    mq.addEventListener("change", update);
    return () => {
      window.clearTimeout(immediate);
      mq.removeEventListener("change", update);
    };
  }, []);

  if (images.length === 0) {
    return (
      <div className="absolute inset-0 overflow-hidden bg-navy" aria-hidden />
    );
  }

  const track = images.length === 1 ? images : [...images, ...images];

  return (
    <div className="absolute inset-0 overflow-hidden bg-navy" aria-hidden>
      <div
        className="flex h-full w-max items-stretch will-change-transform"
        style={
          reduceMotion || images.length === 1
            ? undefined
            : {
                animation: `hero-marquee ${LOOP_DURATION_S}s linear infinite`,
              }
        }
      >
        {track.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="relative flex h-full shrink-0 items-center justify-center"
          >
            <Image
              src={src}
              alt=""
              width={1200}
              height={1800}
              priority={i === 0}
              unoptimized={src.startsWith("/api/site-media/")}
              sizes="(max-width: 768px) 100vw, 70vw"
              className="h-full w-auto max-w-none object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
