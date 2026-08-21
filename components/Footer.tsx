import Link from "next/link";
import { FooterOrnament } from "@/components/FooterOrnament";

export function Footer() {
    return (
        <footer className="relative isolate z-0 overflow-hidden border-t border-beige bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                <div className="flex flex-col items-center gap-4 text-center">
                    <FooterOrnament className="h-12 w-auto max-w-[280px]" />
                    <Link
                        href="#home"
                        className="font-heading text-2xl font-semibold text-navy"
                    >
                        Neto & Mariah
                    </Link>
                    <p className="text-sm text-navy/70"></p>
                    <p className="text-xs text-gold">Com amor, para sempre</p>
                </div>
            </div>
        </footer>
    );
}
