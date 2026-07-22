"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export interface HonorPerson {
    nome: string;
    foto: string;
    texto: string;
    /** Escala da foto no avatar circular (padrão 1.75). */
    fotoZoom?: number;
    /** object-position CSS (ex.: "center 35%"). */
    fotoObjectPosition?: string;
    /** Deslocamento vertical em % após o zoom (positivo = abaixa a imagem). */
    fotoOffsetY?: number;
}

function HonorAvatar({
    person,
    onPhotoOpen,
}: {
    person: HonorPerson;
    onPhotoOpen?: () => void;
}) {
    const [imgError, setImgError] = useState(false);

    if (imgError || !person.foto) {
        return (
            <div className="flex size-24 items-center justify-center rounded-full border-2 border-sage/30 bg-sage/20 font-heading text-2xl font-semibold text-sage">
                {person.nome.charAt(0)}
            </div>
        );
    }

    const fotoZoom = person.fotoZoom ?? 1.75;
    const fotoOffsetY = person.fotoOffsetY ?? 0;
    const fotoObjectPosition = person.fotoObjectPosition ?? "center center";

    const frameClass =
        "relative size-24 overflow-hidden rounded-full border-2 border-sage/30";

    const imgEl = (
        <div
            className="size-full origin-center"
            style={{
                transform: `scale(${fotoZoom}) translateY(${fotoOffsetY}%)`,
            }}
        >
            <Image
                src={person.foto}
                alt={onPhotoOpen ? "" : person.nome}
                width={96}
                height={96}
                sizes="96px"
                className="size-full object-cover"
                style={{ objectPosition: fotoObjectPosition }}
                onError={() => setImgError(true)}
            />
        </div>
    );

    if (onPhotoOpen) {
        return (
            <button
                type="button"
                onClick={onPhotoOpen}
                className={cn(
                    frameClass,
                    "cursor-pointer transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                )}
                aria-label={`Ver foto completa de ${person.nome}`}
            >
                {imgEl}
            </button>
        );
    }

    return <div className={frameClass}>{imgEl}</div>;
}

interface HonorSectionProps {
    title: string;
    subtitle?: string;
    data: HonorPerson[];
}

export function HonorSection({ title, subtitle, data }: HonorSectionProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [lightbox, setLightbox] = useState<HonorPerson | null>(null);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        const reveal = () => setIsVisible(true);

        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            reveal();
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) reveal();
            },
            { threshold: 0.05, rootMargin: "0px 0px -5% 0px" },
        );

        observer.observe(el);

        const onHashChange = () => {
            requestAnimationFrame(() => {
                const next = el.getBoundingClientRect();
                if (next.top < window.innerHeight && next.bottom > 0) {
                    reveal();
                }
            });
        };

        window.addEventListener("hashchange", onHashChange);

        return () => {
            observer.disconnect();
            window.removeEventListener("hashchange", onHashChange);
        };
    }, []);

    return (
        <section ref={sectionRef} className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
                <h2 className="font-heading text-3xl font-semibold text-brown md:text-4xl">
                    {title}
                </h2>
                {subtitle && <p className="mt-4 text-olive">{subtitle}</p>}
            </div>

            <div className="flex flex-wrap justify-center gap-8">
                {data.map((person, i) => (
                    <div
                        key={person.nome}
                        className={cn(
                            "flex w-full max-w-md shrink-0 flex-col items-center rounded-xl border border-olive/20 bg-white p-6 shadow-sm transition-all duration-500",
                            isVisible
                                ? "translate-y-0 opacity-100"
                                : "translate-y-4 opacity-100",
                        )}
                        style={{ transitionDelay: `${i * 100}ms` }}
                    >
                        <HonorAvatar
                            person={person}
                            onPhotoOpen={() => setLightbox(person)}
                        />
                        <h3 className="mt-4 font-heading text-lg font-semibold text-brown">
                            {person.nome}
                        </h3>
                        <p className="mt-2 w-full text-center text-pretty text-sm leading-relaxed text-olive whitespace-pre-line">
                            {person.texto}
                        </p>
                    </div>
                ))}
            </div>

            <Dialog
                open={lightbox !== null}
                onOpenChange={(open) => {
                    if (!open) setLightbox(null);
                }}
            >
                <DialogContent
                    showCloseButton
                    className="max-h-[92dvh] max-w-[min(96vw,56rem)] gap-3 overflow-y-auto border-olive/20 bg-cream p-3 sm:max-w-[min(96vw,56rem)] sm:p-4"
                >
                    {lightbox && (
                        <>
                            <DialogHeader className="space-y-1">
                                <DialogTitle className="font-heading text-center text-lg text-brown sm:text-xl">
                                    {lightbox.nome}
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Foto em tamanho ampliado. Feche o diálogo para
                                    voltar à página.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="relative flex min-h-0 w-full max-w-full justify-center">
                                <Image
                                    src={lightbox.foto}
                                    alt={lightbox.nome}
                                    width={896}
                                    height={1200}
                                    sizes="(max-width: 768px) 96vw, 56rem"
                                    className="max-h-[min(78dvh,80vh)] w-auto max-w-full rounded-lg object-contain"
                                />
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
