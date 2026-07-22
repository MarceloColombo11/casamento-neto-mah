"use client";

import { PhotoCarousel } from "./PhotoCarousel";

export type AboutContent = {
    imagensCarrossel: string[];
    titulo: string;
    subtitulo: string;
    paragrafos: string[];
    assinatura: string;
};

// Fallback quando não houver fotos em public ou lista vazia no JSON
const FALLBACK_IMAGES = [
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
    "https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&q=80",
];

function isCitation(texto: string): boolean {
    const t = texto.trim();
    return t.startsWith('"') || t.includes("Isaías");
}

type AboutSectionProps = {
    content: AboutContent;
};

export function AboutSection({ content }: AboutSectionProps) {
    const carouselImages =
        content.imagensCarrossel.length > 0
            ? content.imagensCarrossel
            : FALLBACK_IMAGES;

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 text-center">
                <h2 className="font-heading text-3xl font-semibold text-brown md:text-4xl">
                    {content.titulo}
                </h2>
                <p className="mt-2 tracking-wide text-sm uppercase text-olive/80">
                    {content.subtitulo}
                </p>
                <div className="mx-auto mt-3 h-px w-12 bg-olive/30" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-8">
                <div className="relative">
                    <PhotoCarousel
                        images={carouselImages}
                        alt="Neto e Mariah"
                    />
                </div>
                <div className="mx-auto max-w-prose space-y-2 text-center">
                    {content.paragrafos.map((texto, i) => {
                        const baseClasses =
                            "text-olive/90 leading-[1.7] text-[15px] md:text-base";
                        if (isCitation(texto)) {
                            return (
                                <blockquote
                                    key={i}
                                    className={`italic ${baseClasses}`}
                                >
                                    {texto}
                                </blockquote>
                            );
                        }
                        const isFirst = i === 0;
                        return (
                            <p
                                key={i}
                                className={`${baseClasses} ${
                                    isFirst
                                        ? "first-letter:mr-0.3 first-letter:font-heading first-letter:text-brown first-letter:[initial-letter:2_1]"
                                        : ""
                                }`}
                            >
                                {texto}
                            </p>
                        );
                    })}
                    <div className="pt-4">
                        <div className="mx-auto mb-3 h-px w-16 bg-olive/25" />
                        <p className="font-heading text-lg font-semibold tracking-widest text-brown">
                            {content.assinatura}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
