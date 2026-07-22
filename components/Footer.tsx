import Link from "next/link";
import { InteractiveLeafPile } from "@/components/InteractiveLeafPile";

export function Footer() {
    return (
        <footer className="relative isolate z-0 overflow-hidden border-t border-olive/20 bg-cream pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
                <div className="relative">
                    <div className="relative z-1 h-28 w-full sm:h-32">
                        <InteractiveLeafPile />
                    </div>
                    <div className="pointer-events-none relative z-2 -mt-14 flex justify-center px-2 pb-0 sm:-mt-16">
                        <div className="flex flex-col items-center gap-2 text-center sm:gap-3">
                            <Link
                                href="#home"
                                className="pointer-events-auto font-heading text-2xl font-semibold text-brown"
                            >
                                N & M
                            </Link>
                            <p className="text-sm text-olive/80">13 · 03 · 2027</p>
                            <p className="text-xs text-olive/60">
                                Neto & Mariah — Com amor, para sempre
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
