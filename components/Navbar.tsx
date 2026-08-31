"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import Monograma from "@/components/monograma";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

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

function linkClass(
    isActive: boolean,
    variant: "bar" | "sheet" = "bar",
    overHero = true,
) {
    return cn(
        "font-heading font-medium transition-colors",
        variant === "sheet"
            ? "text-base tracking-[0.12em]"
            : "text-sm tracking-[0.12em] sm:text-base sm:tracking-[0.14em]",
        variant === "sheet" || !overHero
            ? isActive
                ? "text-navy"
                : "text-navy/70 hover:text-gold"
            : isActive
              ? "text-white"
              : "text-white/80 hover:text-gold",
    );
}

export function Navbar() {
    const [activeSection, setActiveSection] = useState<string>("home");
    const [menuOpen, setMenuOpen] = useState(false);
    const [overHero, setOverHero] = useState(true);

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

    useEffect(() => {
        const hero = document.getElementById("hero");
        if (!hero) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setOverHero(entry.isIntersecting);
            },
            {
                // Troca quando o hero sai debaixo da top bar
                rootMargin: "-72px 0px 0px 0px",
                threshold: 0,
            },
        );
        observer.observe(hero);
        return () => observer.disconnect();
    }, []);

    return (
        <header className="fixed inset-x-0 top-0 z-50 bg-white/5 pt-[env(safe-area-inset-top,0px)] pb-2.5 backdrop-blur-sm supports-backdrop-filter:bg-white/[0.03] [mask-image:linear-gradient(to_bottom,black_calc(100%-10px),transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_calc(100%-10px),transparent)]">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 md:justify-center md:py-3.5 lg:px-8">
                <Link
                    href="#home"
                    className="inline-flex shrink-0 md:hidden"
                    aria-label="Ir para o início"
                >
                    <Monograma
                        simple
                        solid
                        animate={false}
                        ariaHidden
                        className={cn(
                            "h-10 w-10 transition-colors",
                            overHero ? "bg-white" : "bg-navy",
                        )}
                    />
                </Link>

                <nav
                    className="hidden flex-wrap items-center justify-center gap-x-5 gap-y-1.5 md:flex md:gap-x-6"
                    aria-label="Navegação principal"
                >
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={linkClass(
                                link.sectionId === activeSection,
                                "bar",
                                overHero,
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                    <SheetTrigger
                        className={cn(
                            "inline-flex size-10 items-center justify-center rounded-md transition-colors md:hidden",
                            overHero
                                ? "text-white hover:bg-white/15"
                                : "text-navy hover:bg-navy/10",
                        )}
                        aria-label="Abrir menu"
                    >
                        <Menu className="size-6" strokeWidth={2} />
                    </SheetTrigger>
                    <SheetContent
                        side="right"
                        className="w-[min(100%,20rem)] bg-white/95 backdrop-blur-md"
                    >
                        <SheetHeader>
                            <SheetTitle className="font-heading tracking-[0.14em] text-navy">
                                Menu
                            </SheetTitle>
                        </SheetHeader>
                        <nav
                            className="flex flex-col gap-1 px-4 pb-6"
                            aria-label="Navegação principal"
                        >
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMenuOpen(false)}
                                    className={cn(
                                        "rounded-md px-2 py-3",
                                        linkClass(
                                            link.sectionId === activeSection,
                                            "sheet",
                                        ),
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
