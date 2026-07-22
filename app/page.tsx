import Image from "next/image";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FallingLeaves } from "@/components/FallingLeaves";
import Monograma from "@/components/monograma";
import { CountdownTimer } from "@/components/CountdownTimer";
import { GiftsSection } from "@/components/GiftsSection";
import { LocationSection } from "@/components/LocationSection";
import { RsvpSection } from "@/components/RsvpSection";
import { AboutSection } from "@/components/AboutSection";
import { HonorSection } from "@/components/HonorSection";
import { TimelineSection } from "@/components/TimelineSection";
import { PhotoUploadSection } from "@/components/PhotoUploadSection";

import presentesData from "@/data/presentes.json";
import padrinhosData from "@/data/padrinhos.json";
import damasData from "@/data/damas.json";
import convidadosHonraData from "@/data/convidados-honra.json";
import programacaoData from "@/data/programacao.json";
import sobreNosData from "@/data/sobre-nos.json";

export default function Home() {
    return (
        <>
            <Navbar />
            <main id="main" className="pt-20 md:pt-16">
                {/* 1. Home - Hero + Countdown */}
                <section id="home" className="min-h-[100dvh]">
                    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center bg-olive/8 overflow-hidden">
                        <div className="absolute inset-0 opacity-30">
                            <Image
                                src="/images/casal/1.jpeg"
                                alt=""
                                fill
                                priority
                                sizes="100vw"
                                className="object-cover object-center"
                            />
                        </div>
                        <div className="absolute inset-0 bg-cream/70" />
                        <div className="absolute inset-0 bg-olive/5" />
                        <FallingLeaves />
                        <div className="relative z-10 flex flex-col items-center justify-center px-4 py-12 text-center sm:py-16 md:py-20">
                            <Monograma
                                className="mb-4 h-56 w-auto object-contain sm:h-72 md:h-[36rem]"
                                ariaHidden
                            />
                            <p className="text-olive text-lg md:text-xl mb-2">
                                13 · 03 · 2027
                            </p>
                            <p className="font-heading text-brown font-medium mb-12">
                                16:00
                            </p>
                            <CountdownTimer />
                        </div>
                    </div>
                </section>

                {/* 2. Sobre Nós */}
                <section
                    id="sobre-nos"
                    className="py-12 md:py-16 lg:py-20 px-4 bg-cream"
                >
                    <AboutSection content={sobreNosData} />
                </section>

                {/* 3. Padrinhos */}
                <section
                    id="padrinhos"
                    className="py-16 md:py-20 lg:py-24 px-4 bg-cream"
                >
                    <HonorSection
                        title="Padrinhos"
                        subtitle="As pessoas que caminham conosco"
                        data={padrinhosData}
                    />
                </section>

                {/* 4. Convidados de Honra */}
                <section
                    id="convidados-honra"
                    className="py-16 md:py-20 lg:py-24 px-4 bg-cream"
                >
                    <HonorSection
                        title="Convidados de Honra"
                        subtitle="Especiais para nós"
                        data={convidadosHonraData}
                    />
                </section>

                {/* 5. Damas de Honra */}
                <section
                    id="damas"
                    className="py-16 md:py-20 lg:py-24 px-4 bg-cream"
                >
                    <HonorSection
                        title="Damas de Honra"
                        subtitle="Nossas queridas damas"
                        data={damasData}
                    />
                </section>

                {/* 6. Local */}
                <section
                    id="local"
                    className="py-16 md:py-20 lg:py-24 px-4 bg-cream"
                >
                    <LocationSection />
                </section>

                {/* 7. Confirmação */}
                <section
                    id="confirmacao"
                    className="py-16 md:py-20 lg:py-24 px-4 bg-cream"
                >
                    <RsvpSection />
                </section>

                {/* 8. Programação */}
                <section
                    id="programacao"
                    className="py-16 md:py-20 lg:py-24 px-4 bg-cream"
                >
                    <TimelineSection events={programacaoData} />
                </section>

                {/* 9. Presentes */}
                <section
                    id="presentes"
                    className="py-16 md:py-20 lg:py-24 px-4 bg-cream"
                >
                    <GiftsSection
                        presents={presentesData.map(
                            ({ chavePix: _chavePix, ...p }) => p
                        )}
                    />
                </section>

                {/* 10. Suba sua Foto */}
                <section
                    id="fotos"
                    className="py-16 md:py-20 lg:py-24 px-4 bg-cream"
                >
                    <PhotoUploadSection />
                </section>
            </main>
            <Footer />
        </>
    );
}
