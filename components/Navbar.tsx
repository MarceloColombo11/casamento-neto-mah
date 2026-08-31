"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SECTION_IDS = [
    "home",
    "grande-dia",
    "local",
    "traje",
    "nossa-historia",
    "presentes",
    "confirmacao",
] as const;

const NAV_LINKS = [
    { href: "#grande-dia", label: "O Grande Dia", sectionId: "grande-dia" },
    { href: "#local", label: "Local", sectionId: "local" },
    { href: "#traje", label: "Traje", sectionId: "traje" },
    {
        href: "#nossa-historia",
        label: "Nossa História",
        sectionId: "nossa-historia",
    },
    {
        href: "#presentes",
        label: "Lista de presentes",
        sectionId: "presentes",
    },
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
        <header className="absolute inset-x-0 top-0 z-20 pt-[env(safe-area-inset-top,0px)]">
            <div className="mx-auto max-w-7xl px-4 py-3 text-center sm:px-6 sm:py-4 lg:px-8">
                <nav
                    className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:gap-x-6"
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
                                        ? "text-white"
                                        : "text-white/80 hover:text-gold",
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
