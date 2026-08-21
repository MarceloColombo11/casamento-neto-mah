"use client";

import venueData from "@/data/venue.json";

const query =
    "mapsQuery" in venueData && venueData.mapsQuery
        ? venueData.mapsQuery
        : `${venueData.nome}, ${venueData.endereco}`;

const EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed&hl=pt-BR`;

export function MapWidget() {
    return (
        <div className="overflow-hidden rounded-xl border border-beige h-[280px] md:h-[350px] lg:h-[420px]">
            <iframe
                src={EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`${venueData.nome} no mapa`}
                className="block h-full w-full"
            />
        </div>
    );
}
