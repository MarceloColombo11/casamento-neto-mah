"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SECTION_IDS = [
    "home",
    "grande-dia",
    "nossa-historia",
    "local",
    "traje",
    "presentes",
    "confirmacao",
    "fotos",
] as const;

const NAV_LINKS = [
    { href: "#grande-dia", label: "O Grande Dia", sectionId: "grande-dia" },
    {
        href: "#nossa-historia",
        label: "Nossa História",
        sectionId: "nossa-historia",
    },
    { href: "#local", label: "Local", sectionId: "local" },
    { href: "#traje", label: "Traje", sectionId: "traje" },
    { href: "#presentes", label: "Presentes", sectionId: "presentes" },
    { href: "#confirmacao", label: "Confirmação", sectionId: "confirmacao" },
] as const;

export function Navbar() {
    const [activeSection, setActiveSection] = useState<string>("home");

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute("id");
                        if (id) setActiveSection(id);
                    }
                }
            },
            {
                rootMargin: "-20% 0px -70% 0px",
                threshold: 0,
            },
        );
        SECTION_IDS.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <header className="bg-white pt-[env(safe-area-inset-top,0px)]">
            <div className="mx-auto max-w-7xl px-4 py-4 text-center sm:px-6 sm:py-5 lg:px-8">
                <Link href="#home" className="inline-block">
                    <h1 className="font-heading text-xl font-light tracking-[0.22em] text-navy sm:text-2xl md:text-3xl">
                        Mariah & Neto
                    </h1>
                </Link>

                <nav
                    className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:mt-3.5 sm:gap-x-6"
                    aria-label="Navegação principal"
                >
                    {NAV_LINKS.map((link) => {
                        const isActive = link.sectionId === activeSection;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "font-heading text-[11px] font-light tracking-[0.14em] transition-colors sm:text-xs sm:tracking-[0.16em]",
                                    isActive
                                        ? "text-navy"
                                        : "text-navy/70 hover:text-gold",
                                )}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
