"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
    type CarouselApi,
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

const AUTOPLAY_MS = 10000;

interface PhotoCarouselProps {
    images: string[];
    alt?: string;
}

export function PhotoCarousel({
    images,
    alt = "Foto do casal",
}: PhotoCarouselProps) {
    const [api, setApi] = useState<CarouselApi>();

    useEffect(() => {
        if (!api) return;
        const id = window.setInterval(() => {
            api.scrollNext();
        }, AUTOPLAY_MS);
        return () => window.clearInterval(id);
    }, [api]);

    if (images.length === 0) {
        return (
            <div className="flex aspect-[4/5] items-center justify-center rounded-xl border border-olive/20 bg-cream/50">
                <p className="text-olive/80">
                    Adicione fotos em /public/images/casal/
                </p>
            </div>
        );
    }

    return (
        <Carousel className="w-full" setApi={setApi} opts={{ loop: true }}>
            <CarouselContent>
                {images.map((src, i) => (
                    <CarouselItem key={i}>
                        <div className="relative aspect-[4/5] overflow-hidden rounded-xl">
                            <Image
                                src={src}
                                alt={`${alt} ${i + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority={i === 0}
                            />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="left-2 border-olive/30 text-olive hover:bg-sage/20" />
            <CarouselNext className="right-2 border-olive/30 text-olive hover:bg-sage/20" />
        </Carousel>
    );
}
