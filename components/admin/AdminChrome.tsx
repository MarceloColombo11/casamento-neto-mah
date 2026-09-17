"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/admin-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin/convidados", label: "Convidados" },
  { href: "/admin/presentes", label: "Presentes" },
  { href: "/admin/fotos", label: "Fotos" },
  { href: "/admin/textos", label: "Textos" },
] as const;

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white text-navy">
      <header className="border-b border-beige bg-[#f7f4ef]">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-heading text-2xl font-semibold tracking-wide text-navy">
              Neto & Mariah
            </p>
            <p className="mt-1 text-sm text-navy/70">Área dos noivos</p>
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="outline"
              className="h-11 min-h-11 border-gold/60 text-navy"
            >
              Sair
            </Button>
          </form>
        </div>
        <nav
          aria-label="Áreas do painel"
          className="mx-auto flex max-w-2xl flex-wrap gap-x-6 gap-y-2 px-4 pb-4"
        >
          <Link
            href="/admin"
            className={cn(
              "inline-flex min-h-11 items-center font-heading text-lg",
              pathname === "/admin"
                ? "border-b-2 border-gold text-navy"
                : "text-navy/70 hover:text-navy",
            )}
          >
            Início
          </Link>
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex min-h-11 items-center font-heading text-lg",
                  active
                    ? "border-b-2 border-gold text-navy"
                    : "text-navy/70 hover:text-navy",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}
