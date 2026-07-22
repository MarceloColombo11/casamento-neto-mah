import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const playfair = Playfair_Display({
    variable: "--font-playfair",
    subsets: ["latin"],
});

const dmSans = DM_Sans({
    variable: "--font-dm-sans",
    subsets: ["latin"],
});

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

function resolveMetadataBase(): URL {
    const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (site) {
        try {
            return new URL(site);
        } catch {
            // fall through to default
        }
    }
    const vercel = process.env.VERCEL_URL?.trim();
    if (vercel) {
        return new URL(`https://${vercel}`);
    }
    const port = process.env.PORT || "3000";
    return new URL(`http://localhost:${port}`);
}

const shareTitle = "Neto & Mariah — 13.03.2027";
const shareDescription =
    "Celebremos juntos o amor de Neto e Mariah. 13 de março de 2027.";

export const metadata: Metadata = {
    metadataBase: resolveMetadataBase(),
    title: shareTitle,
    description: shareDescription,
    openGraph: {
        type: "website",
        locale: "pt_BR",
        siteName: "Neto & Mariah",
        title: shareTitle,
        description: shareDescription,
        images: [
            {
                url: "/images/monograma-share.jpeg",
                width: 1136,
                height: 1600,
                alt: "Monograma Neto e Mariah — 13 de março de 2027",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: shareTitle,
        description: shareDescription,
        images: ["/images/monograma-share.jpeg"],
    },
    icons: {
        icon: "/Monograma simples.svg",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="pt-BR"
            className={`${playfair.variable} ${dmSans.variable} h-full antialiased scroll-smooth`}
        >
            <body className="min-h-full flex flex-col font-sans">
                <a
                    href="#main"
                    className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-lg bg-sage px-4 py-2 text-white font-medium transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
                >
                    Pular para conteúdo
                </a>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
