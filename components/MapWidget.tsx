"use client";

const EMBED_URL =
    "https://www.google.com/maps?q=Green+Space+Eventos,+R.+Ewaldo+Bauer,+1075,+Vila+Itoupava,+Blumenau+-+SC,+89075-625&output=embed&hl=pt-BR";

export function MapWidget() {
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
                    title="Green Space Eventos no mapa"
                    className="block h-full w-full"
                />
            </div>
        </div>
    );
}
