"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Fotos do fundo da Home.
 * Use imagens inteiras (retrato ou paisagem); elas deslizam em faixa contínua
 * na altura da tela, sem crop forçado de banner.
 */
export const HERO_IMAGES = [
    "/images/hero/01.jpg",
    "/images/hero/02.jpg",
    "/images/hero/03.jpg",
    "/images/hero/02.jpg",
] as const;

/** Duração total do ciclo (todas as fotos). Quanto maior, mais lento/suave. */
const LOOP_DURATION_S = 64;

export function HeroBackgroundCarousel() {
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

    // Duplicamos a sequência para o loop CSS ser contínuo e sem salto.
    const track = [...HERO_IMAGES, ...HERO_IMAGES];

    return (
        <div className="absolute inset-0 overflow-hidden bg-navy" aria-hidden>
            <div
                className="flex h-full w-max items-stretch will-change-transform"
                style={
                    reduceMotion
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
                            sizes="(max-width: 768px) 100vw, 70vw"
                            className="h-full w-auto max-w-none object-contain"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
