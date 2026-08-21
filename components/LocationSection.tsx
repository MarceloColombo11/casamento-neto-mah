"use client";

import Image from "next/image";
import { Instagram, MapPin, Phone } from "lucide-react";
import venueData from "@/data/venue.json";
import { MapWidget } from "./MapWidget";

export function LocationSection() {
    const imagens = venueData.imagens ?? [];

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center md:mb-12">
                <h2 className="font-heading text-3xl font-semibold text-navy md:text-4xl">
                    Local
                </h2>
                <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-navy/80 sm:text-lg">
                    {venueData.descricao[0]}
                </p>
            </div>

            <div className="flex flex-col gap-10 md:gap-12">
                {imagens.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                        {imagens.map((src, i) => (
                            <div
                                key={src}
                                className="relative aspect-[4/3] overflow-hidden rounded-xl border border-beige"
                            >
                                <Image
                                    src={src}
                                    alt={`${venueData.nome} — foto ${i + 1}`}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 50vw"
                                    className="object-cover object-center"
                                    priority={i === 0}
                                />
                            </div>
                        ))}
                    </div>
                ) : null}

                <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
                    <h3 className="font-heading text-2xl font-medium text-navy">
                        {venueData.nome}
                    </h3>

                    <div className="flex items-start justify-center gap-3">
                        <MapPin className="mt-0.5 size-5 shrink-0 text-gold" />
                        <p className="text-pretty text-navy/80">
                            {venueData.endereco}
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-3">
                            <Phone className="size-5 shrink-0 text-gold" />
                            <a
                                href={`tel:+55${venueData.telefone.replace(/\D/g, "")}`}
                                className="text-navy/80 transition-colors hover:text-gold"
                            >
                                {venueData.telefone}
                            </a>
                        </div>
                        <a
                            href={venueData.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-navy/80 transition-colors hover:text-gold"
                            aria-label={`Instagram @${venueData.instagramHandle}`}
                        >
                            <Instagram className="size-5 shrink-0 text-gold" />
                            <span>@{venueData.instagramHandle}</span>
                        </a>
                    </div>

                    {"site" in venueData && venueData.site ? (
                        <a
                            href={venueData.site}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gold underline-offset-4 transition-colors hover:underline"
                        >
                            Site do local
                        </a>
                    ) : null}
                </div>

                <MapWidget />
            </div>
        </div>
    );
}
