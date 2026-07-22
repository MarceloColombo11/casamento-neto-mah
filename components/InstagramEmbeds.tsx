"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
    interface Window {
        instgrm?: { Embeds: { process: () => void } };
    }
}

// URLs de posts do Instagram do local (opcional)
// Perfil: https://www.instagram.com/greenspaceeventos/
const INSTAGRAM_POSTS: string[] = [];

export function InstagramEmbeds() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        const node = containerRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShouldLoad(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "240px 0px" },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!shouldLoad) return;

        const processEmbeds = () => {
            if (typeof window !== "undefined" && window.instgrm) {
                window.instgrm.Embeds.process();
            }
        };

        if (document.querySelector(".instagram-media") && window.instgrm) {
            processEmbeds();
        }
    }, [shouldLoad]);

    if (INSTAGRAM_POSTS.length === 0) {
        return (
            <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-olive/20 bg-cream/40 px-4 text-center text-sm text-olive/70">
                Publicações do Instagram — placeholder. Adicione URLs em
                components/InstagramEmbeds.tsx.
            </div>
        );
    }

    return (
        <div ref={containerRef} className="min-h-[280px]">
            {shouldLoad ? (
                <>
                    <div className="flex flex-wrap justify-center gap-6">
                        {INSTAGRAM_POSTS.map((url) => (
                            <div
                                key={url}
                                className="flex min-w-0 flex-[1_1_280px] max-w-[540px] justify-center overflow-hidden rounded-lg sm:min-w-[280px] [&_.instagram-media]:w-full! [&_.instagram-media]:max-w-full! [&_iframe]:max-w-full!"
                            >
                                <blockquote
                                    className="instagram-media w-full! max-w-[540px]! min-w-0!"
                                    data-instgrm-permalink={url}
                                    data-instgrm-version="14"
                                    style={{
                                        background: "#FFF",
                                        border: 0,
                                        borderRadius: "8px",
                                        boxShadow:
                                            "0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)",
                                        margin: 0,
                                        padding: 0,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <Script
                        src="https://www.instagram.com/embed.js"
                        strategy="lazyOnload"
                        onLoad={() => {
                            if (window.instgrm) {
                                window.instgrm.Embeds.process();
                            }
                        }}
                    />
                </>
            ) : (
                <div
                    className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-olive/20 bg-cream/40 px-4 text-sm text-olive/70"
                    aria-hidden
                >
                    Carregando publicações do Instagram…
                </div>
            )}
        </div>
    );
}
