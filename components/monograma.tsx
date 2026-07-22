"use client";

import { useEffect, useRef } from "react";

interface MonogramaProps {
    /** Tamanho em pixels (largura = altura). Usado quando className não define tamanho. Padrão: 160 */
    size?: number;
    /** Classe CSS para o wrapper (ex: "h-12 md:h-14 w-auto" para Navbar, "h-24 md:h-36 w-auto mb-6" para Hero) */
    className?: string;
    /** Animar com fade-in ao montar. Padrão: true */
    animate?: boolean;
    /** Oculta de leitores de tela (ex: quando há h1 equivalente) */
    ariaHidden?: boolean;
    /** Usa a versão simples do monograma (ex: Navbar). Padrão: false */
    simple?: boolean;
}

/**
 * Monograma Neto & Mariah
 * - Hero / destaque: SVG (`/images/mn.svg`)
 * - Navbar / simple: PNG (`/images/mn.png`) — mais leve
 *
 * Uso:
 *   <Monograma />
 *   <Monograma size={240} className="mx-auto" />
 *   <Monograma className="h-12 md:h-14 w-auto" animate={false} simple />
 */
export default function Monograma({
    size = 160,
    className = "",
    animate = true,
    ariaHidden = false,
    simple = false,
}: MonogramaProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!animate || !ref.current) return;

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        const el = ref.current;

        if (reducedMotion) {
            el.style.opacity = "1";
            el.style.transform = "scale(1)";
            return;
        }

        el.style.opacity = "0";
        el.style.transform = "scale(0.92)";
        el.style.transition = "opacity 1.2s ease, transform 1.2s ease";
        const raf = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.style.opacity = "1";
                el.style.transform = "scale(1)";
            });
        });
        return () => cancelAnimationFrame(raf);
    }, [animate]);

    const hasSizingClass = /\b(h-|w-|size-|min-h|min-w|max-h|max-w)/.test(
        className,
    );

    return (
        <div
            ref={ref}
            className={className}
            style={
                hasSizingClass
                    ? { display: "inline-block" }
                    : { width: size, height: size, display: "inline-block" }
            }
            aria-label={ariaHidden ? undefined : "Monograma Neto e Mariah"}
            aria-hidden={ariaHidden || undefined}
            role="img"
        >
            <img
                src={simple ? "/images/mn.png" : "/images/mn.svg"}
                alt=""
                className={
                    hasSizingClass
                        ? "h-full w-auto max-w-full object-contain"
                        : "object-contain"
                }
                style={
                    hasSizingClass
                        ? { display: "block" }
                        : { width: size, height: size, display: "block" }
                }
            />
        </div>
    );
}
