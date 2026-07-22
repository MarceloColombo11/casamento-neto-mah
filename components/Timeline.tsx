"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    ChevronRight,
    Church,
    Coffee,
    MapPin,
    Music,
    Utensils,
    Wine,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface TimelineEvent {
    hora: string;
    titulo: string;
    resumo: string;
    descricao: string;
    icone: string;
    local?: string;
    destaque?: boolean;
}

const ICON_MAP: Record<string, React.ElementType> = {
    church: Church,
    coffee: Coffee,
    wine: Wine,
    utensils: Utensils,
    music: Music,
};

interface TimelineProps {
    events: TimelineEvent[];
}

function LocationLink({ className }: { className?: string }) {
    return (
        <Link
            href="#local"
            className={cn(
                "inline-flex items-center gap-1.5 text-sm font-medium text-sage underline-offset-2 transition-colors hover:text-olive hover:underline",
                className,
            )}
        >
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            Como chegar
        </Link>
    );
}

export function Timeline({ events }: TimelineProps) {
    const timelineRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
        null,
    );
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updateMotion = () => setPrefersReducedMotion(media.matches);
        updateMotion();
        media.addEventListener("change", updateMotion);
        return () => media.removeEventListener("change", updateMotion);
    }, []);

    useEffect(() => {
        const el = timelineRef.current;
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
        <div ref={timelineRef} className="mx-auto max-w-2xl px-1">
            <div className="relative">
                <div
                    className={cn(
                        "absolute top-2 bottom-2 left-6 w-px origin-top bg-olive/25 transition-transform duration-700 ease-out",
                        isVisible || prefersReducedMotion
                            ? "scale-y-100"
                            : "scale-y-0",
                    )}
                    aria-hidden
                />

                <ol className="space-y-4 sm:space-y-5">
                    {events.map((event, index) => {
                        const IconComponent = ICON_MAP[event.icone] || Church;
                        const showArrivalBadge = event.destaque === true;
                        const staggerDelay = prefersReducedMotion
                            ? 0
                            : index * 100;

                        return (
                            <li
                                key={`${event.hora}-${event.titulo}`}
                                className={cn(
                                    "relative flex gap-4 pl-0 transition-all duration-500 ease-out",
                                    isVisible || prefersReducedMotion
                                        ? "translate-y-0 opacity-100"
                                        : "translate-y-6 opacity-0",
                                )}
                                style={{ transitionDelay: `${staggerDelay}ms` }}
                            >
                                <div className="relative z-10 flex shrink-0 flex-col items-center pt-1">
                                    <div className="relative flex size-12 items-center justify-center rounded-full border-2 border-sage bg-cream text-sage transition-colors">
                                        {showArrivalBadge && (
                                            <span
                                                className={cn(
                                                    "absolute inset-0 rounded-full border border-sage/40",
                                                    !prefersReducedMotion &&
                                                        "animate-ping opacity-30",
                                                )}
                                                aria-hidden
                                            />
                                        )}
                                        <IconComponent className="relative size-5" />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedEvent(event)}
                                    className={cn(
                                        "group min-w-0 flex-1 rounded-xl border border-sage/35 bg-cream/30 p-4 text-left shadow-sm transition-all duration-200 hover:border-sage/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-cream sm:p-5",
                                        !prefersReducedMotion &&
                                            "hover:-translate-y-0.5 hover:shadow-md",
                                    )}
                                    aria-label={`Ver detalhes: ${event.titulo}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                                <time
                                                    dateTime={event.hora}
                                                    className="text-sm font-semibold tracking-wide text-sage tabular-nums"
                                                >
                                                    {event.hora}
                                                </time>
                                                {showArrivalBadge && (
                                                    <span className="rounded-full bg-sage/15 px-2 py-0.5 text-xs font-medium text-olive">
                                                        Cheguem no horário
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="mt-1 font-heading text-lg font-semibold text-brown sm:text-xl">
                                                {event.titulo}
                                            </h3>

                                            <p className="mt-2 line-clamp-2 text-pretty text-sm leading-relaxed text-olive/90">
                                                {event.resumo}
                                            </p>
                                        </div>

                                        <ChevronRight
                                            className="mt-1 size-5 shrink-0 text-sage/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-sage"
                                            aria-hidden
                                        />
                                    </div>

                                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-sage group-hover:underline">
                                        Ver detalhes
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </div>

            <Dialog
                open={!!selectedEvent}
                onOpenChange={(open) => !open && setSelectedEvent(null)}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto border-olive/20 bg-cream">
                    {selectedEvent && (
                        <>
                            <DialogHeader className="space-y-2 text-left">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-sage tabular-nums">
                                        {selectedEvent.hora}
                                    </p>
                                    {selectedEvent.destaque && (
                                        <span className="rounded-full bg-sage/15 px-2 py-0.5 text-xs font-medium text-olive">
                                            Cheguem no horário
                                        </span>
                                    )}
                                </div>
                                <DialogTitle className="font-heading text-xl text-brown">
                                    {selectedEvent.titulo}
                                </DialogTitle>
                                <DialogDescription className="sr-only">
                                    Detalhes do momento da programação do
                                    casamento.
                                </DialogDescription>
                            </DialogHeader>
                            <p className="text-pretty text-sm leading-relaxed text-olive whitespace-pre-line sm:text-base">
                                {selectedEvent.descricao}
                            </p>
                            {selectedEvent.local && (
                                <p className="flex items-start gap-2 text-sm text-olive/90">
                                    <MapPin
                                        className="mt-0.5 size-4 shrink-0 text-sage"
                                        aria-hidden
                                    />
                                    <span>{selectedEvent.local}</span>
                                </p>
                            )}
                            {selectedEvent.local && (
                                <LocationLink className="mt-1" />
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
