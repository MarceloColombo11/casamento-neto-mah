"use client";

// Substitua pelo embed do Google Maps do local definitivo.
const EMBED_URL = "";

export function MapWidget() {
    if (!EMBED_URL) {
        return (
            <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-olive/20 bg-cream/40 px-4 text-center text-sm text-olive/70 md:h-[350px] lg:h-[450px]">
                Mapa do local — placeholder. Cole o embed do Google Maps em
                components/MapWidget.tsx.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-olive/20 h-[280px] md:h-[350px] lg:h-[450px]">
                <iframe
                    src={EMBED_URL}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Local do casamento no mapa"
                    className="block h-full w-full"
                />
            </div>
        </div>
    );
}
