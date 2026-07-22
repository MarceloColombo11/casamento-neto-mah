"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, ChevronDown } from "lucide-react";
import Monograma from "@/components/monograma";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const SECTION_IDS = [
    "home",
    "sobre-nos",
    "padrinhos",
    "convidados-honra",
    "damas",
    "local",
    "confirmacao",
    "programacao",
    "presentes",
    "fotos",
] as const;

const NAV_LINKS_DESKTOP = [
    { href: "#sobre-nos", label: "Sobre Nós", sectionId: "sobre-nos" },
    { href: "#padrinhos", label: "Comitiva", sectionId: "padrinhos" },
    { href: "#local", label: "Local", sectionId: "local" },
    { href: "#confirmacao", label: "Confirmação", sectionId: "confirmacao" },
    { href: "#programacao", label: "Programação", sectionId: "programacao" },
    { href: "#presentes", label: "Presentes", sectionId: "presentes" },
    { href: "#fotos", label: "Fotos", sectionId: "fotos" },
];

const NAV_LINKS_MOBILE_BEFORE_COMITIVA = [
    { href: "#home", label: "Home", sectionId: "home" },
    { href: "#sobre-nos", label: "Sobre Nós", sectionId: "sobre-nos" },
];
const NAV_LINKS_MOBILE_AFTER_COMITIVA = [
    { href: "#local", label: "Local", sectionId: "local" },
    { href: "#confirmacao", label: "Confirmar", sectionId: "confirmacao" },
    { href: "#programacao", label: "Programação", sectionId: "programacao" },
    { href: "#presentes", label: "Presentes", sectionId: "presentes" },
    { href: "#fotos", label: "Fotos", sectionId: "fotos" },
];

const NAV_LINKS_MOBILE_COMITIVA = [
    { href: "#padrinhos", label: "Padrinhos", sectionId: "padrinhos" },
    {
        href: "#convidados-honra",
        label: "Convidados de Honra",
        sectionId: "convidados-honra",
    },
    { href: "#damas", label: "Damas de Honra", sectionId: "damas" },
];

function isSectionInComitiva(sectionId: string) {
    return ["padrinhos", "convidados-honra", "damas"].includes(sectionId);
}

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<string>("home");
    const [comitivaExpanded, setComitivaExpanded] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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

    const handleLinkClick = () => {
        setIsOpen(false);
        setComitivaExpanded(false);
    };

    const isComitivaActive = isSectionInComitiva(activeSection);

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-all duration-300",
                isScrolled
                    ? "bg-cream/95 backdrop-blur-md shadow-sm"
                    : "bg-cream/70 backdrop-blur-sm",
            )}
        >
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link
                    href="#home"
                    className="flex items-center min-h-[44px] min-w-[44px]"
                    aria-label="N & M - Ir para início"
                >
                    <Monograma
                        className="h-12 md:h-14 w-auto object-contain"
                        animate={false}
                        simple
                    />
                </Link>

                {/* Desktop */}
                <div className="hidden lg:flex items-center gap-6">
                    {NAV_LINKS_DESKTOP.map((link) => {
                        const isActive =
                            link.sectionId === activeSection ||
                            (link.sectionId === "padrinhos" &&
                                isComitivaActive);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "text-sm font-medium transition-colors min-h-[44px] flex items-center",
                                    isActive
                                        ? "text-sage border-b-2 border-sage -mb-[2px] pb-0.5"
                                        : "text-olive hover:text-sage",
                                )}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Mobile */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden text-olive min-h-[44px] min-w-[44px]"
                        aria-label="Abrir menu"
                        aria-expanded={isOpen}
                        onClick={() => setIsOpen(true)}
                    >
                        <Menu className="size-6" />
                    </Button>
                    <SheetContent
                        side="right"
                        className="w-[280px] sm:w-[320px] overflow-y-auto"
                    >
                        <div className="flex flex-col gap-1 pt-8">
                            {NAV_LINKS_MOBILE_BEFORE_COMITIVA.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={handleLinkClick}
                                    className={cn(
                                        "font-medium transition-colors py-3 px-2 rounded-lg min-h-[44px] flex items-center",
                                        activeSection === link.sectionId
                                            ? "text-sage bg-sage/10"
                                            : "text-olive hover:text-sage hover:bg-sage/5",
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {/* Comitiva expandível - entre Sobre Nós e Programação */}
                            <div className="mt-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setComitivaExpanded(!comitivaExpanded)
                                    }
                                    className={cn(
                                        "w-full flex items-center justify-between font-medium transition-colors py-3 px-2 rounded-lg min-h-[44px] text-left",
                                        isComitivaActive
                                            ? "text-sage bg-sage/10"
                                            : "text-olive hover:text-sage hover:bg-sage/5",
                                    )}
                                    aria-expanded={comitivaExpanded}
                                    aria-controls="comitiva-submenu"
                                >
                                    Nossa Comitiva
                                    <ChevronDown
                                        className={cn(
                                            "size-5 transition-transform",
                                            comitivaExpanded && "rotate-180",
                                        )}
                                    />
                                </button>
                                <div
                                    id="comitiva-submenu"
                                    className={cn(
                                        "overflow-hidden transition-all duration-200",
                                        comitivaExpanded
                                            ? "max-h-56 opacity-100"
                                            : "max-h-0 opacity-0",
                                    )}
                                >
                                    {NAV_LINKS_MOBILE_COMITIVA.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={handleLinkClick}
                                            className={cn(
                                                "flex items-center font-medium transition-colors py-2.5 pl-6 pr-2 rounded-lg min-h-[40px]",
                                                activeSection === link.sectionId
                                                    ? "text-sage bg-sage/10"
                                                    : "text-olive/90 hover:text-sage hover:bg-sage/5",
                                            )}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            {NAV_LINKS_MOBILE_AFTER_COMITIVA.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={handleLinkClick}
                                    className={cn(
                                        "font-medium transition-colors py-3 px-2 rounded-lg min-h-[44px] flex items-center",
                                        activeSection === link.sectionId
                                            ? "text-sage bg-sage/10"
                                            : "text-olive hover:text-sage hover:bg-sage/5",
                                    )}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </nav>
        </header>
    );
}
